<?php
// Prisme — API des comptes. Le site l'appelle avec fetch (POST + JSON).
// Toutes les requêtes SQL sont préparées : pas d'injection SQL possible.

declare(strict_types=1);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$config = require __DIR__ . '/config.php';

// Valeurs acceptées
const AVATARS = ['arc-en-ciel', 'violet', 'rose', 'bleu', 'vert', 'orange', 'jaune',
    'carpe-01', 'carpe-02', 'carpe-03', 'carpe-04', 'carpe-05', 'carpe-06', 'carpe-07', 'carpe-08'];
const REGIONS = ['romande', 'alemanique', 'tessin'];
const TERMES = ['Agenre', 'Androgyne', 'Aromantique', 'Asexuel·le', 'Bigenre', 'Biromantique', 'Bisexuel·le',
    'Demi-boy', 'Demi-girl', 'Demisexuel·le', 'En questionnement', 'Gay', 'Genderfluid', 'Genderqueer',
    'Graysexuel·le', 'Homoromantique', 'Intergenre', 'Intersexe', 'Lesbienne', 'Non-binaire',
    'Omnisexuel·le', 'Pangenre', 'Panromantique', 'Pansexuel·le', 'Polyamorie', 'Polysexuel·le',
    'Skoliosexuel·le', 'Transfem', 'Transmasc', 'Trigenre'];
const PAYS = ['Canada', 'Portugal', 'Italie', 'Turquie', 'Pays — législation hostile'];
const MANIFS = ['2026-05-17-geneve', '2026-06-13-lausanne', '2026-06-20-geneve', '2026-06-28-fribourg'];
const DUREE_SESSION = '12 HOUR';

// ---------- Outils ----------

function repondre(array $donnees, int $statut = 200)
{
    http_response_code($statut);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

function erreur(string $message, int $statut = 400)
{
    repondre(['erreur' => $message], $statut);
}

function texte(array $entree, string $cle, int $max): string
{
    $valeur = $entree[$cle] ?? '';
    if (!is_string($valeur)) {
        return '';
    }
    $valeur = trim($valeur);
    return mb_strlen($valeur) > $max ? '' : $valeur;
}

function empreinte(string $valeur): string
{
    return hash('sha256', $valeur);
}

function nouveauJeton(): string
{
    return bin2hex(random_bytes(32));
}

function emailValide(string $email): bool
{
    return strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function verifierMotDePasse(string $motDePasse): void
{
    if (mb_strlen($motDePasse) < 8) {
        erreur('Le mot de passe doit contenir au moins 8 caractères.');
    }
    if (strlen($motDePasse) > 72) {
        erreur('Le mot de passe est trop long (72 caractères au maximum).');
    }
}

// Pas plus de $max essais en 15 minutes pour une même action depuis la même adresse
function limiter(PDO $bd, string $action, int $max = 10): void
{
    $cle = empreinte(($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $action);
    $bd->prepare('DELETE FROM tentatives WHERE moment < NOW() - INTERVAL 15 MINUTE')->execute();
    $requete = $bd->prepare('SELECT COUNT(*) FROM tentatives WHERE cle = ?');
    $requete->execute([$cle]);
    if ((int) $requete->fetchColumn() >= $max) {
        erreur('Trop de tentatives. Réessaie dans quelques minutes.', 429);
    }
    $bd->prepare('INSERT INTO tentatives (cle) VALUES (?)')->execute([$cle]);
}

// ---------- E-mails (neutres : jamais de détail sensible dedans) ----------

function envoyerEmail(array $config, string $destinataire, string $sujet, string $html): void
{
    if ($config['mode_email'] === 'fichier') {
        // MAMP : on écrit l'e-mail dans un fichier pour pouvoir cliquer les liens
        $nom = date('Y-m-d_H-i-s') . '_' . bin2hex(random_bytes(3)) . '.html';
        $contenu = '<p><b>À :</b> ' . htmlspecialchars($destinataire) . '<br><b>Objet :</b> '
            . htmlspecialchars($sujet) . '</p><hr>' . $html;
        file_put_contents(__DIR__ . '/emails-dev/' . $nom, $contenu);
        return;
    }
    $entetes = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: " . $config['expediteur'];
    mail($destinataire, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $html, $entetes);
}

function gabarit(string $message, string $bouton = '', string $lien = '', string $apres = ''): string
{
    $html = '<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #2a1845; max-width: 480px;">'
        . '<p>Bonjour,</p><p>' . $message . '</p>';
    if ($bouton !== '') {
        $html .= '<p style="margin: 28px 0;"><a href="' . htmlspecialchars($lien) . '" style="background: #6b3fd4; color: #ffffff; '
            . 'padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">' . $bouton . '</a></p>';
    }
    return $html . $apres . '</div>';
}

function lienConfirmation(array $config, string $type, string $jeton, string $extra = ''): string
{
    return $config['site_url'] . '/confirmer.html?type=' . $type . '&jeton=' . $jeton . $extra;
}

// Crée un lien (ou un code) à usage unique, valable $duree
function creerJetonEmail(PDO $bd, int $id, string $type, string $duree, ?array $donnees = null, ?string $jeton = null): string
{
    $jeton = $jeton ?? nouveauJeton();
    $bd->prepare('DELETE FROM jetons_email WHERE utilisateur_id = ? AND type = ?')->execute([$id, $type]);
    $bd->prepare("INSERT INTO jetons_email (jeton_hash, utilisateur_id, type, donnees, expire_le)
                  VALUES (?, ?, ?, ?, NOW() + INTERVAL $duree)")
        ->execute([empreinte($type === 'code' ? $id . ':' . $jeton : $jeton), $id, $type,
            $donnees === null ? null : json_encode($donnees, JSON_UNESCAPED_UNICODE)]);
    return $jeton;
}

function lireJetonEmail(PDO $bd, string $hash, string $type): ?array
{
    $requete = $bd->prepare('SELECT * FROM jetons_email WHERE jeton_hash = ? AND type = ? AND expire_le > NOW()');
    $requete->execute([$hash, $type]);
    $ligne = $requete->fetch();
    return $ligne ?: null;
}

function envoyerLienReset(PDO $bd, array $config, array $utilisateur): void
{
    $jeton = creerJetonEmail($bd, (int) $utilisateur['id'], 'reset', '1 HOUR');
    envoyerEmail($config, $utilisateur['email'], 'Choisis un nouveau mot de passe', gabarit(
        'Pour choisir un nouveau mot de passe, touche le bouton ci-dessous.',
        'Choisir un nouveau mot de passe', lienConfirmation($config, 'reset', $jeton),
        '<p style="color: #6b5e82; font-size: 14px;">Ce lien expire dans 1 heure. Si tu n\'as rien demandé, ignore cet e-mail.</p>'
    ));
}

// ---------- Session ----------

function utilisateurConnecte(PDO $bd, array $entree): array
{
    $jeton = texte($entree, 'jeton', 64);
    $requete = $bd->prepare('SELECT u.* FROM sessions s JOIN utilisateurs u ON u.id = s.utilisateur_id
                             WHERE s.jeton_hash = ? AND s.expire_le > NOW()');
    $requete->execute([empreinte($jeton)]);
    $utilisateur = $requete->fetch();
    if (!$utilisateur) {
        erreur('Ta session a expiré, reconnecte-toi.', 401);
    }
    return $utilisateur;
}

function donneesCompte(PDO $bd, array $utilisateur): array
{
    $id = (int) $utilisateur['id'];
    $colonne = function (string $sql) use ($bd, $id) {
        $requete = $bd->prepare($sql);
        $requete->execute([$id]);
        return $requete->fetchAll(PDO::FETCH_COLUMN);
    };
    $requete = $bd->prepare('SELECT manif, rappel FROM agenda WHERE utilisateur_id = ?');
    $requete->execute([$id]);
    $agenda = array_map(function ($ligne) {
        return ['manif' => $ligne['manif'], 'rappel' => (bool) $ligne['rappel']];
    }, $requete->fetchAll());

    return [
        'profil' => [
            'pseudo' => $utilisateur['pseudo'],
            'email' => $utilisateur['email'],
            'avatar' => $utilisateur['avatar'],
            'orientation' => $utilisateur['orientation'],
            'ville' => $utilisateur['ville'],
            'region' => $utilisateur['region'],
            'alertes_region' => (bool) $utilisateur['alertes_region'],
        ],
        'favoris' => $colonne('SELECT jour FROM favoris WHERE utilisateur_id = ?'),
        'pays' => $colonne('SELECT pays FROM pays_favoris WHERE utilisateur_id = ?'),
        'agenda' => $agenda,
    ];
}

function trouverParEmail(PDO $bd, string $email): ?array
{
    $requete = $bd->prepare('SELECT * FROM utilisateurs WHERE email = ?');
    $requete->execute([$email]);
    return $requete->fetch() ?: null;
}

// ---------- Lecture de la demande ----------

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    erreur('Méthode non autorisée.', 405);
}
$entree = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($entree)) {
    erreur('Demande invalide.');
}

try {
    $bd = new PDO($config['db_dsn'], $config['db_utilisateur'], $config['db_mot_de_passe'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    erreur('Le serveur de comptes est indisponible pour le moment.', 503);
}

// Ménage de temps en temps : sessions et liens expirés
if (random_int(1, 50) === 1) {
    $bd->exec('DELETE FROM sessions WHERE expire_le < NOW()');
    $bd->exec('DELETE FROM jetons_email WHERE expire_le < NOW()');
}

$action = texte($entree, 'action', 30);

// ---------- Actions ----------

switch ($action) {

    case 'inscription':
        limiter($bd, 'inscription', 5);
        $pseudo = texte($entree, 'pseudo', 30);
        $email = mb_strtolower(texte($entree, 'email', 254));
        $motDePasse = (string) ($entree['mdp'] ?? '');
        if (mb_strlen($pseudo) < 2) {
            erreur('Ton pseudo doit faire entre 2 et 30 caractères.');
        }
        if (!emailValide($email)) {
            erreur('Cette adresse e-mail n\'est pas valide.');
        }
        verifierMotDePasse($motDePasse);

        $existant = trouverParEmail($bd, $email);
        $hash = password_hash($motDePasse, PASSWORD_DEFAULT);
        if ($existant === null) {
            $bd->prepare('INSERT INTO utilisateurs (email, mot_de_passe, pseudo) VALUES (?, ?, ?)')
                ->execute([$email, $hash, $pseudo]);
            $existant = ['id' => (int) $bd->lastInsertId(), 'email' => $email, 'email_confirme' => 0];
        }
        if ((int) $existant['email_confirme'] === 0) {
            // Le mot de passe et le pseudo ne sont appliqués qu'au clic sur le lien :
            // seule la personne qui reçoit l'e-mail peut donc fixer le mot de passe
            $jeton = creerJetonEmail($bd, (int) $existant['id'], 'inscription', '24 HOUR', ['mdp' => $hash, 'pseudo' => $pseudo]);
            envoyerEmail($config, $email, 'Confirme ton adresse e-mail', gabarit(
                'Touche le bouton pour confirmer ton adresse et activer ton compte.',
                'Confirmer mon adresse', lienConfirmation($config, 'inscription', $jeton),
                '<p style="color: #6b5e82; font-size: 14px;">Ce lien expire dans 24 heures. Si tu n\'as rien demandé, ignore cet e-mail.</p>'
            ));
        } else {
            // Compte déjà actif : on prévient la personne, sans rien révéler sur le site
            envoyerEmail($config, $email, 'Tentative de création de compte', gabarit(
                'Quelqu\'un a essayé de créer un compte avec ton adresse, alors que tu en as déjà un. '
                . 'Si c\'est toi, connecte-toi simplement. Si tu as oublié ton mot de passe, utilise « Mot de passe oublié ».'
            ));
        }
        // Même réponse dans tous les cas : impossible de savoir si une adresse est inscrite
        repondre(['message' => 'Si cette adresse est valide, tu vas recevoir un e-mail pour activer ton compte.']);

    case 'connexion':
        limiter($bd, 'connexion', 10);
        $email = mb_strtolower(texte($entree, 'email', 254));
        $motDePasse = (string) ($entree['mdp'] ?? '');
        $utilisateur = trouverParEmail($bd, $email);
        if ($utilisateur === null || !password_verify($motDePasse, $utilisateur['mot_de_passe'])) {
            erreur('E-mail ou mot de passe incorrect.', 401);
        }
        if ((int) $utilisateur['email_confirme'] === 0) {
            erreur('Confirme d\'abord ton adresse e-mail : regarde dans ta boîte mail.', 403);
        }
        if (password_needs_rehash($utilisateur['mot_de_passe'], PASSWORD_DEFAULT)) {
            $bd->prepare('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?')
                ->execute([password_hash($motDePasse, PASSWORD_DEFAULT), $utilisateur['id']]);
        }
        $jeton = nouveauJeton();
        $bd->prepare('INSERT INTO sessions (jeton_hash, utilisateur_id, expire_le) VALUES (?, ?, NOW() + INTERVAL ' . DUREE_SESSION . ')')
            ->execute([empreinte($jeton), $utilisateur['id']]);
        repondre(['jeton' => $jeton] + donneesCompte($bd, $utilisateur));

    case 'moi':
        repondre(donneesCompte($bd, utilisateurConnecte($bd, $entree)));

    case 'deconnexion':
        $bd->prepare('DELETE FROM sessions WHERE jeton_hash = ?')->execute([empreinte(texte($entree, 'jeton', 64))]);
        repondre(['ok' => true]);

    case 'profil':
        $utilisateur = utilisateurConnecte($bd, $entree);
        $pseudo = texte($entree, 'pseudo', 30);
        $avatar = texte($entree, 'avatar', 20);
        $region = texte($entree, 'region', 20);
        $orientation = texte($entree, 'orientation', 40);
        $ville = texte($entree, 'ville', 80);
        if (mb_strlen($pseudo) < 2) {
            erreur('Ton pseudo doit faire entre 2 et 30 caractères.');
        }
        if (!in_array($avatar, AVATARS, true)) {
            erreur('Avatar inconnu.');
        }
        if ($region !== '' && !in_array($region, REGIONS, true)) {
            erreur('Région inconnue.');
        }
        if ($orientation !== '' && !in_array($orientation, TERMES, true)) {
            erreur('Orientation ou identité inconnue.');
        }

        // Paramètres obligatoires : enregistrés tout de suite
        $bd->prepare('UPDATE utilisateurs SET pseudo = ?, avatar = ?, region = ?, alertes_region = ? WHERE id = ?')
            ->execute([$pseudo, $avatar, $region === '' ? null : $region, !empty($entree['alertes_region']) ? 1 : 0, $utilisateur['id']]);

        // Paramètres facultatifs : appliqués seulement après le clic dans l'e-mail
        $attente = $orientation !== (string) $utilisateur['orientation'] || $ville !== (string) $utilisateur['ville'];
        if ($attente) {
            $jeton = creerJetonEmail($bd, (int) $utilisateur['id'], 'modif', '24 HOUR', ['orientation' => $orientation, 'ville' => $ville]);
            envoyerEmail($config, $utilisateur['email'], 'Confirme une modification de ton compte', gabarit(
                'Tu t\'apprêtes à changer un paramètre non obligatoire de ton profil. Peux-tu confirmer qu\'il s\'agit bien de toi&nbsp;?',
                'Accepter', lienConfirmation($config, 'modif', $jeton),
                '<p>Ce n\'est pas toi&nbsp;? <a href="' . htmlspecialchars(lienConfirmation($config, 'modif', $jeton, '&refus=1'))
                . '" style="color: #5a32bd;">Annule le changement et réinitialise ton mot de passe</a>.</p>'
                . '<p style="color: #6b5e82; font-size: 14px;">Ce lien expire dans 24 heures.</p>'
            ));
        }
        $requete = $bd->prepare('SELECT * FROM utilisateurs WHERE id = ?');
        $requete->execute([$utilisateur['id']]);
        repondre(['attente' => $attente] + donneesCompte($bd, $requete->fetch()));

    case 'changer_email':
        $utilisateur = utilisateurConnecte($bd, $entree);
        limiter($bd, 'changer_email', 5);
        $email = mb_strtolower(texte($entree, 'email', 254));
        if (!emailValide($email)) {
            erreur('Cette adresse e-mail n\'est pas valide.');
        }
        if ($email === $utilisateur['email']) {
            erreur('C\'est déjà ton adresse actuelle.');
        }
        if (trouverParEmail($bd, $email) === null) {
            $jeton = creerJetonEmail($bd, (int) $utilisateur['id'], 'email', '24 HOUR', ['email' => $email]);
            envoyerEmail($config, $email, 'Confirme ta nouvelle adresse', gabarit(
                'Touche le bouton pour confirmer ta nouvelle adresse e-mail.',
                'Confirmer cette adresse', lienConfirmation($config, 'email', $jeton),
                '<p style="color: #6b5e82; font-size: 14px;">Ce lien expire dans 24 heures.</p>'
            ));
        }
        envoyerEmail($config, $utilisateur['email'], 'Changement d\'adresse demandé', gabarit(
            'Une demande de changement d\'adresse e-mail a été faite sur ton compte. Si ce n\'est pas toi, '
            . 'choisis vite un nouveau mot de passe avec « Mot de passe oublié » sur le site.'
        ));
        repondre(['message' => 'On a envoyé un lien de confirmation à ta nouvelle adresse. Ton ancienne adresse a été prévenue.']);

    case 'demander_code':
        $utilisateur = utilisateurConnecte($bd, $entree);
        limiter($bd, 'demander_code', 5);
        $code = (string) random_int(100000, 999999);
        creerJetonEmail($bd, (int) $utilisateur['id'], 'code', '15 MINUTE', null, $code);
        envoyerEmail($config, $utilisateur['email'], 'Ton code de sécurité', gabarit(
            'Voici ton code pour changer de mot de passe : <strong style="font-size: 22px; letter-spacing: 3px;">' . $code . '</strong>',
            '', '', '<p style="color: #6b5e82; font-size: 14px;">Il expire dans 15 minutes. Si tu n\'as rien demandé, change ton mot de passe.</p>'
        ));
        repondre(['message' => 'Un code t\'a été envoyé par e-mail.']);

    case 'changer_mdp':
        $utilisateur = utilisateurConnecte($bd, $entree);
        limiter($bd, 'changer_mdp', 5);
        $code = texte($entree, 'code', 6);
        $motDePasse = (string) ($entree['mdp'] ?? '');
        verifierMotDePasse($motDePasse);
        $ligne = lireJetonEmail($bd, empreinte($utilisateur['id'] . ':' . $code), 'code');
        if ($ligne === null) {
            erreur('Le code est incorrect ou a expiré. Demande un nouveau code.');
        }
        $bd->prepare('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?')
            ->execute([password_hash($motDePasse, PASSWORD_DEFAULT), $utilisateur['id']]);
        $bd->prepare('DELETE FROM jetons_email WHERE jeton_hash = ?')->execute([$ligne['jeton_hash']]);
        // Déconnecte les autres appareils
        $bd->prepare('DELETE FROM sessions WHERE utilisateur_id = ? AND jeton_hash <> ?')
            ->execute([$utilisateur['id'], empreinte(texte($entree, 'jeton', 64))]);
        repondre(['message' => 'Ton mot de passe a été changé ✓']);

    case 'oubli':
        limiter($bd, 'oubli', 5);
        $utilisateur = trouverParEmail($bd, mb_strtolower(texte($entree, 'email', 254)));
        if ($utilisateur !== null && (int) $utilisateur['email_confirme'] === 1) {
            envoyerLienReset($bd, $config, $utilisateur);
        }
        repondre(['message' => 'Si un compte existe avec cette adresse, tu vas recevoir un lien pour choisir un nouveau mot de passe.']);

    case 'confirmer':
        limiter($bd, 'confirmer', 20);
        $type = texte($entree, 'type', 20);
        if (!in_array($type, ['inscription', 'email', 'modif', 'reset'], true)) {
            erreur('Lien invalide.');
        }
        $ligne = lireJetonEmail($bd, empreinte(texte($entree, 'lien', 64)), $type);
        if ($ligne === null) {
            erreur('Ce lien n\'est plus valable. Recommence l\'opération depuis le site.', 410);
        }
        $id = (int) $ligne['utilisateur_id'];
        $donnees = json_decode((string) $ligne['donnees'], true) ?: [];
        $supprimer = $bd->prepare('DELETE FROM jetons_email WHERE jeton_hash = ?');

        if ($type === 'inscription') {
            $bd->prepare('UPDATE utilisateurs SET email_confirme = 1, mot_de_passe = ?, pseudo = ? WHERE id = ?')
                ->execute([$donnees['mdp'], $donnees['pseudo'], $id]);
            $supprimer->execute([$ligne['jeton_hash']]);
            repondre(['message' => 'Ton adresse est confirmée. Tu peux te connecter.']);
        }
        if ($type === 'email') {
            if (trouverParEmail($bd, $donnees['email']) !== null) {
                erreur('Cette adresse est déjà utilisée par un autre compte.');
            }
            $bd->prepare('UPDATE utilisateurs SET email = ? WHERE id = ?')->execute([$donnees['email'], $id]);
            $supprimer->execute([$ligne['jeton_hash']]);
            repondre(['message' => 'Ta nouvelle adresse e-mail est enregistrée.']);
        }
        if ($type === 'modif') {
            $supprimer->execute([$ligne['jeton_hash']]);
            if (!empty($entree['refus'])) {
                // Ce n'est pas la personne : on annule, on déconnecte tout et on envoie un lien de mot de passe
                $bd->prepare('DELETE FROM sessions WHERE utilisateur_id = ?')->execute([$id]);
                $requete = $bd->prepare('SELECT * FROM utilisateurs WHERE id = ?');
                $requete->execute([$id]);
                envoyerLienReset($bd, $config, $requete->fetch());
                repondre(['message' => 'La modification est annulée et tous les appareils ont été déconnectés. '
                    . 'On t\'a envoyé un e-mail pour choisir un nouveau mot de passe.']);
            }
            $bd->prepare('UPDATE utilisateurs SET orientation = ?, ville = ? WHERE id = ?')
                ->execute([($donnees['orientation'] ?? '') ?: null, ($donnees['ville'] ?? '') ?: null, $id]);
            repondre(['message' => 'C\'est confirmé : la modification de ton profil est enregistrée.']);
        }
        // reset : nouveau mot de passe
        $motDePasse = (string) ($entree['mdp'] ?? '');
        verifierMotDePasse($motDePasse);
        $bd->prepare('UPDATE utilisateurs SET mot_de_passe = ?, email_confirme = 1 WHERE id = ?')
            ->execute([password_hash($motDePasse, PASSWORD_DEFAULT), $id]);
        $supprimer->execute([$ligne['jeton_hash']]);
        $bd->prepare('DELETE FROM sessions WHERE utilisateur_id = ?')->execute([$id]);
        repondre(['message' => 'Ton nouveau mot de passe est enregistré. Tu peux te connecter.']);

    case 'basculer':
        $utilisateur = utilisateurConnecte($bd, $entree);
        $table = texte($entree, 'table', 20);
        $valeur = texte($entree, 'valeur', 80);
        $tables = [
            'favoris' => ['favoris', 'jour', preg_match('/^j(0[1-9]|[12][0-9]|30)$/', $valeur) === 1],
            'pays' => ['pays_favoris', 'pays', in_array($valeur, PAYS, true)],
            'agenda' => ['agenda', 'manif', in_array($valeur, MANIFS, true)],
        ];
        if (!isset($tables[$table]) || !$tables[$table][2]) {
            erreur('Valeur inconnue.');
        }
        [$nomTable, $colonne] = $tables[$table];
        $retrait = $bd->prepare("DELETE FROM $nomTable WHERE utilisateur_id = ? AND $colonne = ?");
        $retrait->execute([$utilisateur['id'], $valeur]);
        $actif = $retrait->rowCount() === 0;
        if ($actif) {
            $bd->prepare("INSERT INTO $nomTable (utilisateur_id, $colonne) VALUES (?, ?)")->execute([$utilisateur['id'], $valeur]);
        }
        repondre(['actif' => $actif]);

    case 'rappel':
        $utilisateur = utilisateurConnecte($bd, $entree);
        $bd->prepare('UPDATE agenda SET rappel = ? WHERE utilisateur_id = ? AND manif = ?')
            ->execute([!empty($entree['rappel']) ? 1 : 0, $utilisateur['id'], texte($entree, 'manif', 80)]);
        repondre(['ok' => true]);

    case 'supprimer_compte':
        $utilisateur = utilisateurConnecte($bd, $entree);
        // ON DELETE CASCADE efface aussi sessions, favoris, pays, agenda et liens
        $bd->prepare('DELETE FROM utilisateurs WHERE id = ?')->execute([$utilisateur['id']]);
        repondre(['message' => 'Ton compte et toutes tes données ont été effacés.']);

    default:
        erreur('Action inconnue.');
}

# Remote Control — piloter Claude Code depuis le téléphone ou un navigateur

Remote Control connecte [claude.ai/code](https://claude.ai/code) ou l'app Claude
(iOS / Android) à une session Claude Code qui tourne **sur ta machine**. Le code
et l'accès aux fichiers restent en local ; seule la conversation est relayée.

> Rien ici n'est un réglage de ce dépôt. Un `true` dans un
> `.claude/settings.json` de projet est **ignoré par conception** : un dépôt ne
> peut pas activer Remote Control pour ceux qui le clonent. Ce mémo décrit ce
> qu'il faut faire sur ton poste.

## Activer pour toutes les sessions, tous les projets

Dans n'importe quelle session Claude Code :

```
/config
```

puis **« Enable Remote Control for all sessions »**. Trois valeurs : `true`,
`false`, `default` (suit le défaut de l'organisation).

Équivalent en fichier, à faire une fois :

```bash
mkdir -p ~/.claude
python3 - <<'PY'
import json, pathlib
p = pathlib.Path.home() / ".claude/settings.json"
s = json.loads(p.read_text()) if p.exists() else {}
s["remoteControlAtStartup"] = True
p.write_text(json.dumps(s, indent=2))
print(p, "->", s["remoteControlAtStartup"])
PY
```

Le même interrupteur ailleurs :

- **App Desktop** : Settings > Claude Code > *Enable remote control by default*
- **Extension VS Code** : *Enable Remote Control for all sessions* dans la
  section Settings du menu de commandes (v2.1.203+)

## Les sessions déjà ouvertes

Le réglage global ne s'applique qu'aux sessions démarrées après. Pour les
autres :

- `/remote-control` (ou `/rc`) dans la session en cours — l'historique de
  conversation est conservé.
- Conversation déjà fermée : `claude --continue` ou `claude --resume`, elle se
  rattache à la session claude.ai existante.

## Modes de lancement

| Commande | Effet |
| --- | --- |
| `claude --remote-control` (`--rc`) | Session interactive normale, pilotable aussi à distance |
| `claude remote-control` | Mode serveur : reste ouvert, sert jusqu'à 32 sessions à la demande |
| `/remote-control` | Bascule la session courante |

En mode serveur, `--spawn worktree` donne à chaque session à la demande son
propre worktree git, ce qui évite que deux sessions se marchent dessus sur les
mêmes fichiers. `--name "..."` fixe le titre visible dans la liste des sessions.

## Prérequis

- Plan **Pro, Max, Team ou Enterprise**. Les clés API ne sont pas supportées.
  Sur Team / Enterprise, un Owner doit d'abord activer le toggle dans les
  [admin settings](https://claude.ai/admin-settings/claude-code).
- Connexion via `/login` (compte claude.ai) — pas Bedrock, Vertex ni Foundry.
- `ANTHROPIC_BASE_URL` non défini, ou pointant sur `api.anthropic.com`.
- Aucune de ces variables définie : `DISABLE_TELEMETRY`, `DO_NOT_TRACK`,
  `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_GROWTHBOOK`. Chacune
  coupe l'évaluation du feature flag dont dépend Remote Control.
- Lancer `claude` au moins une fois **dans le répertoire du projet** pour
  accepter le dialogue de confiance : depuis le répertoire home, il n'est jamais
  enregistré.

## À savoir

Avec l'auto-connect, chaque processus Claude Code interactif enregistre sa
propre session distante : cinq terminaux ouverts donnent cinq entrées dans la
liste sur claude.ai. Le mode serveur regroupe au contraire plusieurs sessions
dans un seul processus.

Après un `Ctrl+C` sur `claude remote-control`, les sessions restent
récupérables pendant environ quatre heures depuis le même répertoire :
`claude remote-control` les reprend toutes, `--continue` reprend celle de
départ, `--session-id <id>` une seule.

Référence : <https://code.claude.com/docs/en/remote-control>

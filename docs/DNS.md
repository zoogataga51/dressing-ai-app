# Entrées DNS de dressingai.fr (zone gérée chez OVH)

Où : OVH > Web Cloud > Noms de domaine > dressingai.fr > onglet « Zone DNS » > « Ajouter une entrée ».
Dans le champ « Sous-domaine », taper SEULEMENT ce qui est indiqué (OVH ajoute « .dressingai.fr » tout seul).
Ne pas toucher aux entrées déjà présentes (Zimbra, hébergement).

## E-mails de connexion de l'appli (Resend, domaine id 73474369-dedd-46ad-8868-5cacf29fcba6)

| # | Type | Sous-domaine | Priorité | Cible / valeur |
|---|---|---|---|---|
| 1 | TXT | `resend._domainkey` | | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDkdKr85Bwf6j1y1x3ggdHSY0hPEbacWMu9EE+02YyGtiuV2hOSKvYs/ItG8I2Gwi0Jg9irwmebS1Rcv2IvHTQwMY+pBn4QlJ+9z9VtPWg9YTZRGgnrphflIaWF5yEGACDC2P1g1Jl5MoIesL2NkfMsFSZd9+E4xAH5woRxIUZ1uwIDAQAB` |
| 2 | MX | `send` | 10 | `feedback-smtp.eu-west-1.amazonses.com.` |
| 3 | TXT | `send` | | `v=spf1 include:amazonses.com ~all` |
| 4 | CNAME | `rsend` | | `send.forge.rmta.net.` |
| 5 | TXT | `_dmarc` | | `v=DMARC1; p=none; rua=mailto:contact@dressingai.fr` |

La n°5 (DMARC) est recommandée : Gmail et Yahoo classent moins souvent en indésirables les domaines qui l'ont.
Ces valeurs sont publiques (aucun secret). Propagation : de quelques minutes à quelques heures.

# DRV Synoptique — Application Web

Application web pour la **conception de synoptiques d'installation VRF/DRV** 
avec calcul automatique des débours, manchons et vérifications.

---

## Marques intégrées

- **Westpoint** — Gamme WMV série 4 (R410A)  
- **Ayrwell** — Gamme ARV série 3 (R410A)

---

## Fonctionnalités

### Sélection équipements
- Choix de la marque (Westpoint / Ayrwell)
- Sélection de l'unité extérieure parmi les modèles disponibles
- Ajout d'unités intérieures : type, puissance, étiquette de local, zone

### Synoptique graphique
- Dessin SVG interactif avec :
  - Tuyau liquide (rouge)
  - Tuyau gaz (bleu)
  - Câble de communication (vert pointillé)
  - Manchons / distributeurs (points orange avec référence)
- Drag & drop des unités intérieures
- Auto-layout automatique
- Zoom / dézoom

### Calculs automatiques
- **Taux de connexion** UI/UE avec code couleur (OK / Faible / Dépassé)
- **Débours tuyauteries** : diamètre liquide et gaz selon puissance cumulée (norme EN 378)
- **Manchons** : sélection du type (Y/T/H) selon puissance, nomenclature complète
- **Vérifications** : longueur réseau, dénivelé, nb UI, taux de connexion

### Export
- **Dossier PDF complet** : synoptique + tableaux + fiches techniques UE + vérifications
- Impression directe
- Export JSON pour sauvegarde/reprise

---

## Structure des fichiers

```
drv-synoptique/
├── index.html          # Page principale
├── css/
│   └── style.css       # Styles (thème sombre, composants)
├── js/
│   ├── app.js          # Contrôleur principal, gestion état
│   ├── canvas.js       # Moteur de dessin SVG
│   ├── calc.js         # Calculs (taux, débours, manchons)
│   └── pdf.js          # Export dossier PDF
└── data/
    ├── brands.js       # Base de données Westpoint & Ayrwell
    └── piping.js       # Tables tuyauteries & manchons
```

---

## Utilisation

### Lancement
Ouvrir `index.html` dans un navigateur moderne (Chrome, Firefox, Edge).  
**Aucun serveur ou installation requise.**

### Workflow typique
1. Sélectionner la marque (Westpoint ou Ayrwell)
2. Choisir l'unité extérieure dans la liste
3. Ajouter les unités intérieures (type + puissance + local)
4. Cliquer **⚡ Auto-layout** pour organiser le synoptique
5. Vérifier le bilan de puissance et la checklist
6. Exporter le dossier PDF

### Raccourcis clavier
- `Suppr` — Supprimer l'unité sélectionnée
- `Échap` — Désélectionner
- `Ctrl +` — Zoom avant
- `Ctrl -` — Zoom arrière

---

## Tables de dimensionnement

### Tuyauteries cuivre
| Puissance max | Ø Liquide | Ø Gaz    |
|---------------|-----------|----------|
| ≤ 2.0 kW      | 6.35 mm   | 9.52 mm  |
| ≤ 4.0 kW      | 6.35 mm   | 12.7 mm  |
| ≤ 7.1 kW      | 9.52 mm   | 15.88 mm |
| ≤ 9.5 kW      | 9.52 mm   | 19.05 mm |
| ≤ 14 kW       | 9.52 mm   | 22.22 mm |
| ≤ 22.4 kW     | 12.7 mm   | 25.4 mm  |
| ≤ 28 kW       | 12.7 mm   | 28.58 mm |
| ≤ 36 kW       | 15.88 mm  | 31.75 mm |
| ≤ 48 kW       | 19.05 mm  | 34.93 mm |
| > 48 kW       | 22.22 mm  | 41.28 mm |

### Manchons
| Puissance max | Référence | Type |
|---------------|-----------|------|
| ≤ 3.5 kW      | Y-03      | Y 2 voies |
| ≤ 5.6 kW      | Y-05      | Y 2 voies |
| ≤ 9.0 kW      | Y-09      | Y 2 voies |
| ≤ 14 kW       | T-14      | T 3 voies |
| ≤ 22.4 kW     | T-22      | T 3 voies |
| ≤ 33.5 kW     | H-34      | H 4 voies |
| ≤ 48 kW       | H-48      | H 4 voies |
| > 48 kW       | H-56      | H 4 voies |

---

## Normes et références
- EN 378 : Installation frigorifique
- DTU 66.3 : Installations de climatisation
- Préconisations fabricants Westpoint & Ayrwell

---

## Évolutions possibles
- Ajout d'autres marques (Daikin, Mitsubishi, etc.)
- Calcul des pertes de charge précis
- Export DWG / CAD
- Mode multi-UE (couplage modules)
- Application mobile (PWA)

---

*DRV Synoptique v1.0 — 2024*

# EGRISS portal: GAIN, SDG, ID Questions

A demo, for comments, of one portal that joins three EGRISS Secretariat workstreams on a shared record:

- **GAIN**: examples of statistics on refugees, IDPs and stateless persons, by country.
- **SDG**: indicator values for displaced populations, and how each value was calculated.
- **ID Questions**: how surveys identify refugees and IDPs, against the EGRISS identification module.

All three start from the same globe and country map. Datasets is a side resource reached from each layer.

Open `index.html` to see it. It is a single page; the folders `covers/`, `recs/` and `sdg/` hold its images.

## Status

This is a working demo, not a released product. Wording, design and some content are still under review.

## What is in the SDG layer

Every SDG value shown was recalculated from the survey file it comes from. For each value the page lists the variables, the answers counted, the denominator, the group variable, the weight and the file, and says whether the recalculation gives the published value.

- `build/fds_verify.py` is the script used for the three UNHCR Forced Displacement Surveys (South Sudan 2023, Pakistan 2024, Zambia 2025).
- `build/verify/*.json` hold the results for all surveys: percentages, record counts and variable labels only.
- `build/verify/scripts_*/` hold the working scripts used for the other surveys, kept as a record. Folder names in them are replaced by placeholders.

## Data rules

- No survey microdata is in this repository. The microdata is licensed and has to be requested from its holder (UNHCR Microdata Library, World Bank Microdata Library, DHS Program, UNICEF MICS).
- Only aggregates and variable metadata (names, question wording, answer codes) are stored here.
- Values for small groups of records are marked on the page and should be read with care.

## Building the page

The build reads from the three workstream repositories and from two files kept by the Secretariat.

1. Copy `build/paths.example.json` to `build/paths.local.json` and set the five locations: the `GAIN-story`, `gain_sdg_workstream` and `idq-map` repositories, the question bank file and the GAIN roster file. The roster is optional.
2. Run, with Python 3:

```bash
python build/mk_template.py
```

```bash
python build/build_demo.py
```

This writes `index.html`.

| File | Role |
|---|---|
| `build/newapp.js`, `newcss.css`, `newbody.html`, `demo_template_v10.html` | The page: script, styles and layout |
| `build/mk_template.py` | Joins those into one template |
| `build/build_demo.py` | Collects the data and writes `index.html` |
| `build/vermerge.py` | Adds the recalculation results to each SDG value |
| `build/cmaps.py`, `build/bounds/` | Country maps and first-level administrative areas |
| `build/mdl/labels.json` | Question wording and answer codes from the UNHCR Microdata Library data dictionaries |
| `build/fetch2.py` | Fetches that wording from the public catalogue |

## Sources

- GAIN examples, country maps, camp locations and displacement figures: the GAIN story (`GAIN-story`).
- SDG values and goal icons: the SDG map (`gain_sdg_workstream`). Goal icons are those of the United Nations Sustainable Development Goals.
- Identification module, causes of displacement and displacement points: the identification questions map (`idq-map`).
- Administrative boundaries in `build/bounds/`: geoBoundaries.
- Question wording for the Forced Displacement Surveys: UNHCR Microdata Library, catalogue entries 1175, 1421 and 1423.

## Country map relief

`relief/` holds one grey shaded-relief image per country, baked by `build/mk_relief.py` from the Natural Earth 10m "Gray Earth with Shaded Relief" raster (public domain, naturalearthdata.com). The raster itself is not kept here. Neighbouring countries and their labels come from the GAIN story country files.

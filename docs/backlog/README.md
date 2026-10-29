# Backlog MVP (podle Project Proposalu)

Soubory `NN-zf-XX.md` mají hlavičku `title`, `labels`, `milestone`, která se použije při vytvoření issue.
Číslování ZF-01 až ZF-23 odpovídá `zenfeed_implementacni_plan.md`; ZF-24 až ZF-35 doplňují požadavky proposalu.
Tabulka pokrytí je v `TRACEABILITY.md`.

1. Nanečisto: `bash create-issues.sh` (nic nevytvoří).
2. Ostře: `bash create-issues.sh --apply` (potřebuje `gh auth login` a právo Write/Triage).

Skript přeskočí issue se stejným názvem, takže ho lze spustit opakovaně.

Shop logos for the Inclusion Festival card.

Name each file after the shop's id in data/festival.json, e.g.
    spice-route.png  →  { "id": "spice-route", "logo": "spice-route.png" }

Drop the originals in ANY size here, then run:

    node scripts/festival-logos.mjs

It squares them, trims the padding, resizes to 256x256 and writes WebP —
which keeps every logo around 15-30 KB. Sixteen of those is under half a
megabyte, so the repo stays small and the card loads instantly on a phone
in a restaurant car park.

Do not commit a 4000px photo straight off someone's phone. The script exists
so you never have to think about it.

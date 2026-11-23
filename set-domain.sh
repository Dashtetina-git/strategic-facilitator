#!/bin/sh
# Usage: ./set-domain.sh dariaponomareva.com
# Replaces the https://example.com placeholder in every SEO file with the real address.
set -e
[ -n "$1" ] || { echo "Usage: ./set-domain.sh yourdomain.com"; exit 1; }
d=$(echo "$1" | sed -e 's|^https*://||' -e 's|/*$||')
cd "$(dirname "$0")"
for f in index.html ru/index.html sitemap.xml robots.txt llms.txt; do
  sed -i '' "s|https://example.com|https://$d|g" "$f"
done
echo "Done: https://$d"
grep -c "https://$d" index.html ru/index.html sitemap.xml robots.txt llms.txt

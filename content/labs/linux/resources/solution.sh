#!/usr/bin/env sh

# 1
echo "$USER"
# 2
pwd
# 3
find / -name "os-release"
# 4
cd ../..
cd /
# 5
ls
ls .
ls /
# 6
cd "$HOME" || exit
# 7
mkdir -p exercices
mkdir -p "$HOME/exercices"
# 8
cd "$HOME/exercices" || exit
# 9
touch exercices.txt
# 10
cat << EOT >> exercices.txt
The quick brown fox jumps over the lazy dog.
Waltz, bad nymph, for quick jigs vex.
Glib jocks quiz nymph to vex dwarf.
Sphinx of black quartz, judge my vow.
Sphinx of black quartz, judge my vow.
How vexingly quick daft zebras jump!
The five boxing wizards jump quickly.
Jackdaws love my big sphinx of quartz.
Pack my box with five dozen liquor jugs.
EOT
# 11
echo "Pack my box with five dozen liquor jugs." >> exercices.txt
# 12
cat exercices.txt
# 13
wc -l exercices.txt
# 14
grep -o "quick" exercices.txt | wc -l
# 15
uniq < exercices.txt | sort > pangrammes.txt
# 16
rm exercices.txt
mv pangrammes.txt td0.txt
# 17
diff exercices.txt pangrammes.txt > diff.txt
# 18
base64 -d << EOT
TmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXAKTmV2ZXIgZ29ubmEgbGV0IHlvdSBkb3duCk5ldmVyIGdv
bm5hIHJ1biBhcm91bmQgYW5kIGRlc2VydCB5b3UKTmV2ZXIgZ29ubmEgbWFrZSB5b3UgY3J5Ck5l
dmVyIGdvbm5hIHNheSBnb29kYnllCk5ldmVyIGdvbm5hIHRlbGwgYSBsaWUgYW5kIGh1cnQgeW91
Cg==
EOT
# 19
cp -r exercices td0
# 20
tar cvf td0.tar td0
# 21
du -b td0.tar
# 22
rm -r exercices

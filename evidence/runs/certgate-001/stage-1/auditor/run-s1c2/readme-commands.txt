README 'Run it' block at 9d044991, executed by auditor-xwz6 with image tag 'certgate-audit:9d04499' substituted for 'certgate' and container name 'certgate-audit' for 'certgate' (to avoid colliding with other seats' local images). 2026-10-12T18:05:26.1526481Z
## 1 published port + curl
609e32dedb79d49ccbef3025dd873d672babdae4ac664ef19da2c9546c4b5754
HTTP 200 proposal=review
certgate-audit
## 2 fully offline, query from inside
CertGate listening on port 3000 (mode mock)
review
exit=0
## 3 CLI case
exit=0 proposal=review
## 4 suite in image: see suite-network-none.txt (188 passed)

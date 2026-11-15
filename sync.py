# sync.py  —  usage:  python sync.py "commit message"
import subprocess, sys, pathlib, re

ROOT = pathlib.Path(__file__).parent
MSG = " ".join(sys.argv[1:]).strip() or "chore: update"


def sh(cmd, timeout=600):
    r = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True,
                       timeout=timeout, encoding="utf-8", errors="replace")
    return r.returncode, ((r.stdout or "") + (r.stderr or "")).strip()


def main():
    print("== 1/4 diagnose ==")
    d = ROOT / "diagnose.py"
    if d.exists():
        code, out = sh("python diagnose.py")
        head = [l for l in out.splitlines() if l.startswith("RESULT:")]
        print("  " + (head[0] if head else "see diagnose-report.txt"))
        errs = [l for l in out.splitlines() if l.startswith("[ERROR]")]
        if errs:
            print("  " + str(len(errs)) + " errors still present — committing anyway so nothing is lost.")
    else:
        print("  diagnose.py not found, skipped")

    print("\n== 2/4 stage ==")
    code, out = sh("git add -A")
    if code != 0:
        print(out); sys.exit(1)
    code, out = sh("git status --short")
    if not out:
        print("  nothing to commit"); return
    if re.search(r"node_modules|\.next/", out):
        print("  !! node_modules or .next is staged — fix .gitignore first")
        print(out[:800]); sys.exit(1)
    print("  " + str(len(out.splitlines())) + " files staged")

    print("\n== 3/4 commit ==")
    code, out = sh('git commit -m "' + MSG.replace('"', "'") + '"')
    print("  " + out.splitlines()[0] if out else "  done")
    if code != 0 and "nothing to commit" not in out:
        print(out); sys.exit(1)

    print("\n== 4/4 push ==")
    code, out = sh("git push", 900)
    print(out)
    if code != 0:
        print("\n  Push failed. Turn on VPN, or run: git config --global http.sslBackend openssl")
        sys.exit(1)
    print("\nSynced -> https://github.com/fariqiviana-bot/careerly")


if __name__ == "__main__":
    main()
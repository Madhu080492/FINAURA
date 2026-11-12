
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def run_step(step_name, command):

    print("\n" + "=" * 55)
    print(f"STARTING: {step_name}")
    print("=" * 55)

    result = subprocess.run(
        command,
        cwd=BASE_DIR
    )

    if result.returncode != 0:
        print(f"\nFAILED: {step_name}")
        print("Remaining steps cancelled.")
        raise SystemExit(result.returncode)

    print(f"\nSUCCESS: {step_name}")


def main():

    print("\n==========================================")
    print("       FINAURA MARKET UPDATE")
    print("==========================================")

    run_step(
        "FETCHING NSE DATA FROM TEJHQ",
        [
            sys.executable,
            "-m",
            "backend.api.market_data"
        ]
    )

    run_step(
        "UPDATING MASTER DATASET",
        [
            sys.executable,
            str(BASE_DIR / "update_master_dataset.py")
        ]
    )

    print("\n==========================================")
    print("       MARKET UPDATE COMPLETED")
    print("==========================================")

    print("\nMaster dataset is ready.")
    print("Existing ML model remains unchanged.")


if __name__ == "__main__":

    try:
        main()

    except KeyboardInterrupt:
        print("\nUpdate cancelled by user.")

    except Exception as error:
        print(f"\nUPDATE FAILED: {error}")
        raise

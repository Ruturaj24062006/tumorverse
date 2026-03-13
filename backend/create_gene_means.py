"""
Create gene_means.pkl for TumorVerse inference-time imputation.

Usage:
    python create_gene_means.py --train-csv path/to/training_data.csv --gene-list model/gene_list.pkl
"""

import argparse
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd


def _save_placeholder_means(gene_list_path: str, output_path: str, value: float) -> None:
    """Create a fallback mean vector for testing when training CSV is unavailable."""
    gene_list_file = Path(gene_list_path)
    if not gene_list_file.exists():
        raise FileNotFoundError(f"gene_list file not found: {gene_list_file}")

    gene_list = joblib.load(gene_list_file)
    ordered_genes = [str(g) for g in gene_list]
    means = pd.Series(np.full(len(ordered_genes), value, dtype=np.float32), index=ordered_genes)

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(means, out_path)

    print("WARNING: Created fallback means, not derived from training data.")
    print("Predictions may be less reliable until real training means are generated.")
    print(f"Saved fallback gene means to: {out_path}")
    print(f"Total genes in means: {len(means)}")


def create_gene_means(train_csv: str, gene_list_path: str, output_path: str) -> None:
    train_csv_file = Path(train_csv)
    gene_list_file = Path(gene_list_path)

    if not train_csv_file.exists():
        raise FileNotFoundError(
            f"Training CSV not found: {train_csv_file}\n"
            "Use the real path to your training dataset, for example:\n"
            "  python create_gene_means.py --train-csv D:/data/training_data.csv --gene-list model/gene_list.pkl --output model/gene_means.pkl"
        )

    if not gene_list_file.exists():
        raise FileNotFoundError(f"gene_list file not found: {gene_list_file}")

    train_df = pd.read_csv(train_csv_file)
    gene_list = joblib.load(gene_list_file)
    ordered_genes = [str(g) for g in gene_list]

    # Keep only training genes that exist in CSV and convert to numeric.
    present_genes = [g for g in ordered_genes if g in train_df.columns]
    if not present_genes:
        raise ValueError("No training genes from gene_list were found in the CSV.")

    numeric_train = train_df[present_genes].apply(pd.to_numeric, errors="coerce")
    means = numeric_train.mean(axis=0, skipna=True)

    # Reindex to full training order; remaining NaN are filled with global mean.
    means = means.reindex(ordered_genes)
    global_mean = float(means.mean(skipna=True))
    means = means.fillna(global_mean).astype("float32")

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(means, out_path)

    print(f"Saved gene means to: {out_path}")
    print(f"Total genes in means: {len(means)}")
    print(f"Genes found in training CSV: {len(present_genes)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create gene_means.pkl for inference-time imputation")
    parser.add_argument("--train-csv", required=True, help="Path to training CSV used to compute means")
    parser.add_argument("--gene-list", default="model/gene_list.pkl", help="Path to gene_list.pkl")
    parser.add_argument("--output", default="model/gene_means.pkl", help="Output path for gene_means.pkl")
    parser.add_argument(
        "--allow-placeholder-means",
        action="store_true",
        help="Generate fallback constant means if training CSV is missing (testing only).",
    )
    parser.add_argument(
        "--placeholder-value",
        type=float,
        default=0.0,
        help="Constant value for fallback means when --allow-placeholder-means is set.",
    )
    args = parser.parse_args()

    try:
        create_gene_means(args.train_csv, args.gene_list, args.output)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}")

        if args.allow_placeholder_means:
            print("Falling back to placeholder means because --allow-placeholder-means was provided...")
            _save_placeholder_means(args.gene_list, args.output, args.placeholder_value)
            return

        print("\nIf you do not have the training CSV yet, you can create temporary means for testing:")
        print(
            "  python create_gene_means.py --train-csv D:/real/path/training_data.csv "
            "--gene-list model/gene_list.pkl --output model/gene_means.pkl --allow-placeholder-means"
        )
        sys.exit(1)
    except Exception as exc:
        print(f"ERROR: Failed to create gene means: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

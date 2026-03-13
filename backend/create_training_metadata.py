"""
Create TumorVerse metadata artifacts from training CSV.

Outputs:
- gene_list.pkl: ordered list of training genes
- gene_means.pkl: mean expression value per training gene

Usage:
    python create_training_metadata.py --train-csv D:/data/training_data.csv

Optional:
    python create_training_metadata.py \
      --train-csv D:/data/training_data.csv \
      --output-dir model \
      --exclude-cols sample_id label cancer_type
"""

import argparse
from pathlib import Path
from typing import List

import joblib
import pandas as pd


def build_metadata(
    train_csv: str,
    output_dir: str,
    exclude_cols: List[str],
) -> None:
    train_path = Path(train_csv)
    if not train_path.exists():
        raise FileNotFoundError(f"Training CSV not found: {train_path}")

    df = pd.read_csv(train_path)
    if df.empty:
        raise ValueError("Training CSV is empty.")

    # Normalize exclusion matching to lowercase.
    exclude = {c.lower() for c in exclude_cols}

    # Keep all columns except known non-gene columns; preserve column order.
    gene_columns = [c for c in df.columns if c.lower() not in exclude]
    if not gene_columns:
        raise ValueError("No gene columns detected after excluding non-gene columns.")

    gene_df = df[gene_columns].apply(pd.to_numeric, errors="coerce")
    gene_means = gene_df.mean(axis=0, skipna=True)

    # Fill any all-NaN gene means with global mean to avoid missing values in artifact.
    global_mean = float(gene_means.mean(skipna=True))
    if pd.isna(global_mean):
        global_mean = 0.0
    gene_means = gene_means.fillna(global_mean).astype("float32")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    gene_list_path = out_dir / "gene_list.pkl"
    gene_means_path = out_dir / "gene_means.pkl"

    joblib.dump([str(c) for c in gene_columns], gene_list_path)
    joblib.dump(gene_means, gene_means_path)

    print(f"Saved gene_list.pkl: {gene_list_path}")
    print(f"Saved gene_means.pkl: {gene_means_path}")
    print(f"Total training genes: {len(gene_columns)}")
    print(f"Training rows used: {len(df)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create gene_list.pkl and gene_means.pkl from training CSV")
    parser.add_argument("--train-csv", required=True, help="Path to training CSV used for model training")
    parser.add_argument(
        "--output-dir",
        default="model",
        help="Directory to write metadata files (default: backend/model)",
    )
    parser.add_argument(
        "--exclude-cols",
        nargs="*",
        default=["sample", "sample_id", "id", "label", "target", "cancer_type"],
        help="Columns to exclude from gene feature set",
    )

    args = parser.parse_args()
    build_metadata(args.train_csv, args.output_dir, args.exclude_cols)


if __name__ == "__main__":
    main()

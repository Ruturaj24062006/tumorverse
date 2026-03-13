"""
Script to create gene_list.pkl for feature alignment.

This file should contain the exact list of gene names (in order) that were 
used during model training. The gene list is used to align user-uploaded CSV 
files with the expected 20531 features.

Usage:
    1. If you have the original training data CSV:
       python create_gene_list.py --from-csv path/to/training_data.csv
    
    2. To create a placeholder gene list (use this if you don't have training data):
       python create_gene_list.py --placeholder
"""

import argparse
import joblib
import pandas as pd
from pathlib import Path


def create_from_csv(csv_path: str, output_path: str = "model/gene_list.pkl"):
    """
    Extract gene names from training data CSV and save as gene_list.pkl.
    
    Args:
        csv_path: Path to the CSV file used for model training
        output_path: Path where gene_list.pkl will be saved
    """
    print(f"Loading training data from: {csv_path}")
    
    # Read the CSV
    df = pd.read_csv(csv_path)
    
    # Detect if first column is an index/label column
    if 'cancer_type' in df.columns or 'label' in df.columns:
        # Remove label columns
        gene_columns = [col for col in df.columns 
                       if col.lower() not in ['cancer_type', 'label', 'sample', 'patient_id']]
    else:
        # Assume all columns are genes except possibly the first one
        if df.iloc[:, 0].dtype == object:
            gene_columns = list(df.columns[1:])
        else:
            gene_columns = list(df.columns)
    
    print(f"Found {len(gene_columns)} gene columns")
    
    if len(gene_columns) != 20531:
        print(f"⚠ WARNING: Expected 20531 genes, but found {len(gene_columns)}")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            return
    
    # Save gene list
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    joblib.dump(gene_columns, output_path)
    print(f"✓ Gene list saved to: {output_path}")
    print(f"  Total genes: {len(gene_columns)}")
    print(f"  First 5 genes: {gene_columns[:5]}")
    print(f"  Last 5 genes: {gene_columns[-5:]}")


def create_placeholder(output_path: str = "model/gene_list.pkl", n_genes: int = 20531):
    """
    Create a placeholder gene list with common cancer genes and numbered placeholders.
    
    This is useful if you don't have access to the original training data gene names.
    The model will still work, but feature alignment will be purely positional.
    
    Args:
        output_path: Path where gene_list.pkl will be saved
        n_genes: Number of genes to include (default: 20531)
    """
    print(f"Creating placeholder gene list with {n_genes} genes...")
    
    # Common cancer-related genes (first ~200)
    known_genes = [
        # Tumor suppressor genes
        'TP53', 'PTEN', 'RB1', 'APC', 'BRCA1', 'BRCA2', 'VHL', 'NF1', 'NF2',
        'WT1', 'TSC1', 'TSC2', 'CDKN2A', 'CDKN2B', 'CDKN1A', 'CDKN1B',
        # Oncogenes
        'MYC', 'MYCN', 'KRAS', 'NRAS', 'HRAS', 'BRAF', 'EGFR', 'ERBB2', 'ERBB3',
        'MET', 'ALK', 'RET', 'ROS1', 'FLT3', 'KIT', 'PDGFRA', 'PDGFRB',
        # DNA repair genes
        'MLH1', 'MSH2', 'MSH6', 'PMS2', 'ATM', 'ATR', 'CHEK1', 'CHEK2',
        'BRIP1', 'PALB2', 'RAD51', 'RAD51C', 'RAD51D', 'FANCF',
        # Cell cycle genes
        'CDK4', 'CDK6', 'CCND1', 'CCND2', 'CCND3', 'CCNE1', 'CCNA2', 'CCNB1',
        'E2F1', 'E2F3', 'CDC25A', 'CDC25B', 'CDC25C',
        # Apoptosis genes
        'BCL2', 'BCL2L1', 'BCL2L11', 'BAX', 'BAK1', 'BID', 'BAD', 'PUMA',
        'CASP3', 'CASP8', 'CASP9', 'APAF1', 'FADD', 'FAS', 'TNFRSF10B',
        # PI3K/AKT/mTOR pathway
        'PIK3CA', 'PIK3CB', 'PIK3CD', 'AKT1', 'AKT2', 'AKT3', 'MTOR',
        'TSC1', 'TSC2', 'PTEN', 'PIK3R1', 'PIK3R2',
        # Wnt pathway
        'CTNNB1', 'APC', 'AXIN1', 'AXIN2', 'GSK3B', 'WNT1', 'WNT3A',
        # TGF-beta pathway
        'TGFBR1', 'TGFBR2', 'SMAD2', 'SMAD3', 'SMAD4', 'TGFB1',
        # Notch pathway
        'NOTCH1', 'NOTCH2', 'NOTCH3', 'NOTCH4', 'JAG1', 'DLL3', 'DLL4',
        # Chromatin remodeling
        'ARID1A', 'ARID1B', 'ARID2', 'SMARCA4', 'SMARCB1', 'PBRM1',
        'SETD2', 'KDM5A', 'KDM5C', 'KDM6A', 'EZH2', 'SUZ12',
        # Transcription factors
        'FOXO1', 'FOXO3', 'FOXM1', 'JUN', 'FOS', 'STAT3', 'STAT5A', 'STAT5B',
        'RUNX1', 'ETV6', 'PAX5', 'PAX8', 'GATA3', 'GATA4',
        # Immune checkpoint genes
        'PDCD1', 'CD274', 'CTLA4', 'LAG3', 'HAVCR2', 'TIGIT',
        # Angiogenesis
        'VEGFA', 'VEGFB', 'VEGFC', 'FLT1', 'KDR', 'FLT4', 'HIF1A',
        # Metabolism
        'IDH1', 'IDH2', 'ACLY', 'FASN', 'SCD', 'PKM', 'LDHA', 'G6PD',
        # Miscellaneous important cancer genes
        'MDM2', 'MDM4', 'TP73', 'FGFR1', 'FGFR2', 'FGFR3', 'FGFR4',
        'EPHA3', 'EPHB4', 'DDR2', 'JAK1', 'JAK2', 'JAK3', 'MAP2K1', 'MAP2K2',
    ]
    
    # Create full gene list
    gene_list = []
    
    # Add known genes first
    gene_list.extend(known_genes)
    
    # Fill remaining with numbered placeholders
    remaining = n_genes - len(known_genes)
    for i in range(remaining):
        gene_list.append(f'GENE_{i:05d}')
    
    # Ensure we have exactly n_genes
    gene_list = gene_list[:n_genes]
    
    # Save gene list
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    joblib.dump(gene_list, output_path)
    print(f"✓ Placeholder gene list saved to: {output_path}")
    print(f"  Total genes: {len(gene_list)}")
    print(f"  Known cancer genes: {len(known_genes)}")
    print(f"  Placeholder genes: {remaining}")
    print(f"\n⚠ NOTE: This is a PLACEHOLDER gene list.")
    print(f"  For best results, create gene_list.pkl from your actual training data:")
    print(f"  python create_gene_list.py --from-csv path/to/training_data.csv")


def main():
    parser = argparse.ArgumentParser(
        description="Create gene_list.pkl for feature alignment"
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '--from-csv',
        type=str,
        help='Create gene list from training data CSV file'
    )
    group.add_argument(
        '--placeholder',
        action='store_true',
        help='Create placeholder gene list with common cancer genes'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='model/gene_list.pkl',
        help='Output path for gene_list.pkl (default: model/gene_list.pkl)'
    )
    
    parser.add_argument(
        '--n-genes',
        type=int,
        default=20531,
        help='Number of genes for placeholder (default: 20531)'
    )
    
    args = parser.parse_args()
    
    if args.from_csv:
        create_from_csv(args.from_csv, args.output)
    elif args.placeholder:
        create_placeholder(args.output, args.n_genes)


if __name__ == '__main__':
    main()

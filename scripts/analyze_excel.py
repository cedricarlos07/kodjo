#!/usr/bin/env python
import pandas as pd
import sys
import json
from datetime import datetime

def analyze_excel(file_path):
    """
    Analyse le fichier Excel pour comprendre sa structure
    """
    try:
        # Lire le fichier Excel
        print(f"Lecture du fichier: {file_path}")
        xlsx = pd.ExcelFile(file_path)
        
        # Afficher les noms des feuilles
        print("\nFeuilles dans le fichier Excel:")
        for sheet_name in xlsx.sheet_names:
            print(f"- {sheet_name}")
        
        # Analyser chaque feuille
        for sheet_name in xlsx.sheet_names:
            print(f"\nAnalyse de la feuille: {sheet_name}")
            df = pd.read_excel(xlsx, sheet_name=sheet_name)
            
            # Afficher les dimensions
            print(f"Dimensions: {df.shape[0]} lignes x {df.shape[1]} colonnes")
            
            # Afficher les noms de colonnes
            print("\nNoms des colonnes:")
            for col in df.columns:
                print(f"- {col}")
            
            # Afficher quelques exemples de données
            print("\nExemples de données (5 premières lignes):")
            print(df.head().to_string())
            
            # Vérifier les valeurs uniques dans certaines colonnes importantes
            if not df.empty and len(df.columns) > 0:
                print("\nValeurs uniques dans les colonnes importantes:")
                for col in df.columns:
                    if isinstance(col, str) and any(keyword in col.lower() for keyword in 
                                                 ['coach', 'professor', 'level', 'niveau', 'schedule', 'horaire', 'telegram', 'zoom']):
                        unique_values = df[col].dropna().unique()
                        print(f"\n{col} ({len(unique_values)} valeurs uniques):")
                        if len(unique_values) < 20:  # Afficher seulement si pas trop de valeurs
                            for val in unique_values:
                                print(f"  - {val}")

    except Exception as e:
        print(f"Erreur lors de l'analyse du fichier Excel: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_excel.py <chemin_du_fichier_excel>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    analyze_excel(file_path)
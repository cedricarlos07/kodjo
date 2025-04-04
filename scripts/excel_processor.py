import pandas as pd
import json
import os
import re
from datetime import datetime, timedelta
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('excel_processor')

class ExcelProcessor:
    def __init__(self, excel_path):
        """
        Initialise le processeur Excel.
        
        Args:
            excel_path (str): Chemin vers le fichier Excel à traiter
        """
        self.excel_path = excel_path
        
        # Mappage des colonnes pour chaque feuille
        self.dynamic_sheet_columns = {
            'coach_name': 'Unnamed: 0',
            'coach_email': 'Unnamed: 1',
            'course_pattern': None,  # Sera détecté dynamiquement
            'telegram_group': 'Group ID'
        }
        
        # Patterns pour l'extraction des données
        self.course_level_patterns = ['BBG', 'ABG', 'IG']
        self.schedule_patterns = ['MW', 'TT', 'SS', 'FS']
        self.time_pattern = r'(\d+:\d+\s*(?:AM|PM|am|pm))'
        
    def validate_excel_structure(self, df, sheet_name):
        """
        Vérifie la structure du fichier Excel
        
        Args:
            df (DataFrame): Le DataFrame à valider
            sheet_name (str): Nom de la feuille Excel
            
        Returns:
            bool: True si la structure est valide, False sinon
        """
        required_columns = [col for col in self.dynamic_sheet_columns.values() if col is not None]
        
        # Vérifier si les colonnes requises sont présentes
        for col in required_columns:
            if col not in df.columns:
                logger.error(f"Colonne '{col}' manquante dans la feuille '{sheet_name}'")
                return False
        
        return True
    
    def load_excel_data(self):
        """
        Charge et valide les données Excel
        
        Returns:
            dict: Un dictionnaire contenant les DataFrames pour chaque feuille pertinente
        """
        try:
            # Lire le fichier Excel
            excel_data = pd.ExcelFile(self.excel_path, engine='openpyxl')
            sheet_names = excel_data.sheet_names
            
            data_frames = {}
            
            # Traiter chaque feuille
            for sheet_name in sheet_names:
                if "Schedule" in sheet_name:
                    df = pd.read_excel(
                        self.excel_path,
                        sheet_name=sheet_name,
                        engine='openpyxl'
                    )
                    
                    # Valider la structure
                    if self.validate_excel_structure(df, sheet_name):
                        # Nettoyer les données
                        df = self.clean_data(df)
                        data_frames[sheet_name] = df
                    else:
                        logger.warning(f"Structure invalide pour la feuille '{sheet_name}', ignorée")
            
            if not data_frames:
                logger.error("Aucune feuille valide trouvée dans le fichier Excel")
                return None
                
            return data_frames
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement Excel: {str(e)}")
            return None
    
    def clean_data(self, df):
        """
        Nettoie et structure les données
        
        Args:
            df (DataFrame): Le DataFrame à nettoyer
            
        Returns:
            DataFrame: Le DataFrame nettoyé
        """
        # Supprimer les lignes entièrement vides
        df = df.dropna(how='all')
        
        # Remplacer les valeurs NaN par des chaînes vides pour les colonnes de type string
        str_columns = df.select_dtypes(include=['object']).columns
        df[str_columns] = df[str_columns].fillna('')
        
        return df
    
    def extract_course_pattern(self, course_text):
        """
        Extrait le pattern du cours (MW, TT, etc.) à partir du texte du cours
        
        Args:
            course_text (str): Texte du cours
            
        Returns:
            str: Le pattern du cours ou None si non trouvé
        """
        for pattern in self.schedule_patterns:
            if pattern in course_text:
                return pattern
        return None
    
    def extract_course_level(self, course_text):
        """
        Extrait le niveau du cours (BBG, ABG, etc.) à partir du texte du cours
        
        Args:
            course_text (str): Texte du cours
            
        Returns:
            str: Le niveau du cours ou None si non trouvé
        """
        for level in self.course_level_patterns:
            if level in course_text:
                return level
        return None
    
    def extract_time(self, course_text):
        """
        Extrait l'heure du cours à partir du texte du cours
        
        Args:
            course_text (str): Texte du cours
            
        Returns:
            str: L'heure du cours ou None si non trouvée
        """
        time_match = re.search(self.time_pattern, course_text)
        if time_match:
            return time_match.group(1)
        return None
    
    def extract_days_from_pattern(self, pattern):
        """
        Extrait les jours de la semaine à partir du pattern du cours
        
        Args:
            pattern (str): Pattern du cours (MW, TT, etc.)
            
        Returns:
            list: Liste des jours de la semaine (0=Lundi, 6=Dimanche)
        """
        pattern_to_days = {
            'MW': [0, 2],  # Lundi et Mercredi
            'TT': [1, 3],  # Mardi et Jeudi
            'FS': [4, 5],  # Vendredi et Samedi
            'SS': [5, 6]   # Samedi et Dimanche
        }
        
        return pattern_to_days.get(pattern, [])
    
    def process_course_data(self, data_frames):
        """
        Traite les données des cours à partir des DataFrames
        
        Args:
            data_frames (dict): Dictionnaire des DataFrames par feuille
            
        Returns:
            list: Liste des cours structurés
        """
        courses = []
        
        for sheet_name, df in data_frames.items():
            schedule_type = "dynamic" if "Dynamic" in sheet_name else "fixed"
            
            # Obtenir l'index de la première ligne avec des données
            start_row = 0
            while start_row < len(df) and not df.iloc[start_row][self.dynamic_sheet_columns['coach_name']]:
                start_row += 1
            
            for idx, row in df.iloc[start_row:].iterrows():
                coach_name = row[self.dynamic_sheet_columns['coach_name']]
                coach_email = row[self.dynamic_sheet_columns['coach_email']]
                
                # Vérifier si cette ligne contient un coach
                if isinstance(coach_name, str) and coach_name.strip():
                    # Parcourir toutes les colonnes pour trouver les cours
                    for col in df.columns:
                        cell_value = row[col]
                        
                        # Si la cellule n'est pas vide et contient un pattern de cours
                        if isinstance(cell_value, str) and any(pattern in cell_value for pattern in self.schedule_patterns):
                            course_pattern = self.extract_course_pattern(cell_value)
                            course_level = self.extract_course_level(cell_value)
                            course_time = self.extract_time(cell_value)
                            
                            # Si les informations essentielles sont présentes
                            if course_pattern and course_level and course_time:
                                days = self.extract_days_from_pattern(course_pattern)
                                
                                # Créer un cours pour chaque jour
                                for day_idx, day in enumerate(days):
                                    course = {
                                        'name': f"{coach_name} - {course_level} - {course_pattern} - {course_time}",
                                        'coach': coach_name,
                                        'level': course_level,
                                        'schedule_pattern': course_pattern,
                                        'day_of_week': day,
                                        'time': course_time,
                                        'coach_email': coach_email,
                                        'schedule_type': schedule_type,
                                        'telegram_group': row.get(self.dynamic_sheet_columns['telegram_group'], ''),
                                        'zoom_link': '',  # Sera rempli ultérieurement
                                        'description': f"Cours de {course_level} avec {coach_name}, {course_pattern} à {course_time}"
                                    }
                                    
                                    courses.append(course)
                                    logger.info(f"Cours extrait: {course['name']} (Jour {day})")
        
        return courses
    
    def save_to_json(self, courses, output_path=None):
        """
        Sauvegarde les cours au format JSON
        
        Args:
            courses (list): Liste des cours à sauvegarder
            output_path (str, optional): Chemin de sortie pour le fichier JSON
            
        Returns:
            str: Chemin du fichier JSON créé
        """
        if not output_path:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f"temp_courses_{timestamp}.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Données sauvegardées dans {output_path}")
        return output_path
    
    def process_with_error_handling(self):
        """
        Traite les données avec gestion des erreurs
        
        Returns:
            list: Liste des cours traités ou None en cas d'erreur
        """
        try:
            # Charger les données
            data_frames = self.load_excel_data()
            if not data_frames:
                return None
            
            # Traiter les données
            courses = self.process_course_data(data_frames)
            
            # Log des résultats
            logger.info(f"Traitement terminé: {len(courses)} cours traités")
            
            return courses
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None


def main(excel_path):
    """
    Fonction principale pour traiter un fichier Excel
    
    Args:
        excel_path (str): Chemin vers le fichier Excel
        
    Returns:
        str: Chemin vers le fichier JSON de sortie ou None en cas d'erreur
    """
    processor = ExcelProcessor(excel_path)
    courses = processor.process_with_error_handling()
    
    if courses:
        json_path = processor.save_to_json(courses)
        return json_path
    
    return None


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        excel_file = sys.argv[1]
        result = main(excel_file)
        if result:
            print(f"SUCCESS: {result}")
        else:
            print("ERROR: Processing failed")
    else:
        print("Usage: python excel_processor.py <path_to_excel_file>")
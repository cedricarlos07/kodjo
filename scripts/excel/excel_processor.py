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
            'coach_name': 'Coach',
            'coach_email': 'EMAIL',
            'course_name': 'Salma Choufani - ABG - SS - 2:00pm',
            'telegram_group': 'TELEGRAM GROUP ID',
            'day': 'DAY',
            'time_france': 'TIME (France)',
            'zoom_link': 'Zoom Link'
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
        # Définir les colonnes requises en fonction de la feuille
        required_columns = []
        
        if "Dynamic" in sheet_name:
            required_columns = ['Coach', 'Zoom Link', 'TIME (France)']
        elif "Fix" in sheet_name:
            required_columns = ['Salma Choufani - ABG - SS - 2:00pm', 'DAY', 'TIME (France)', 'TELEGRAM GROUP ID']
        elif "Message" in sheet_name:
            required_columns = ['Telegram Chat Id', 'Telegram Message', 'Sending Date']
        
        # Vérifier si les colonnes requises sont présentes
        missing_columns = []
        for col in required_columns:
            if col not in df.columns:
                missing_columns.append(col)
        
        if missing_columns:
            logger.error(f"Colonnes manquantes dans la feuille '{sheet_name}': {missing_columns}")
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
    
    def get_day_name(self, day_idx):
        """
        Convertit l'index du jour en nom du jour
        
        Args:
            day_idx (int): Index du jour (0=Lundi, 6=Dimanche)
            
        Returns:
            str: Nom du jour
        """
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[day_idx]
    
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
            
            # Traitement différent selon le type de feuille
            if "Dynamic" in sheet_name:
                courses.extend(self.process_dynamic_schedule(df, schedule_type))
            elif "Fix" in sheet_name:
                courses.extend(self.process_fixed_schedule(df, schedule_type))
        
        return courses
    
    def process_dynamic_schedule(self, df, schedule_type):
        """
        Traite les données de la feuille Dynamic Schedule
        
        Args:
            df (DataFrame): Le DataFrame contenant les données
            schedule_type (str): Type de planning (dynamic/fixed)
            
        Returns:
            list: Liste des cours traités
        """
        courses = []
        
        # Parcourir toutes les lignes
        for idx, row in df.iterrows():
            coach = row.get('Coach', '')
            
            # Ignorer les lignes sans coach
            if not isinstance(coach, str) or not coach.strip():
                continue
            
            # Extraire les informations
            zoom_link = row.get('Zoom Link', '')
            time_france = row.get('TIME (France)', '')
            
            # Identifier le pattern et le niveau à partir du titre
            course_name = row.get('Topic ', '')
            
            # Vérifier si c'est une ligne de cours valide
            if not isinstance(course_name, str) or not course_name.strip():
                continue
            
            course_pattern = self.extract_course_pattern(course_name)
            course_level = self.extract_course_level(course_name)
            course_time = self.extract_time(course_name) or time_france
            
            # Si les informations essentielles sont présentes
            if coach and (course_pattern or course_level):
                # Utiliser le pattern pour déterminer les jours
                days = []
                if course_pattern:
                    days = self.extract_days_from_pattern(course_pattern)
                elif 'Start Date & Time' in row:
                    # Si pas de pattern, essayer d'extraire le jour à partir de la date de début
                    try:
                        start_date = pd.to_datetime(row['Start Date & Time'])
                        day_number = start_date.weekday()  # 0=Monday, 6=Sunday
                        days = [day_number]
                    except:
                        # Fallback sur lundi si pas de date valide
                        days = [0]
                else:
                    # Fallback sur lundi si pas de date
                    days = [0]
                
                # Pattern et niveau par défaut si non trouvés
                if not course_pattern:
                    course_pattern = "MW"  # Pattern par défaut
                if not course_level:
                    course_level = "ABG"  # Niveau par défaut
                
                # Créer un cours pour chaque jour
                for day in days:
                    course = {
                        'name': f"{coach} - {course_level} - {course_pattern} - {course_time}",
                        'instructor': "Kodjo",
                        'professorName': coach,
                        'level': course_level,
                        'schedule': course_pattern,
                        'dayOfWeek': self.get_day_name(day),
                        'time': course_time,
                        'zoomLink': zoom_link,
                        'telegramGroup': '',
                        'schedule_type': schedule_type,
                        'description': f"Cours de {course_level} avec {coach}, {course_pattern} à {course_time}"
                    }
                    
                    courses.append(course)
                    logger.info(f"Cours extrait (Dynamic): {course['name']} (Jour {day})")
        
        return courses
    
    def process_fixed_schedule(self, df, schedule_type):
        """
        Traite les données de la feuille Fix Schedule
        
        Args:
            df (DataFrame): Le DataFrame contenant les données
            schedule_type (str): Type de planning (dynamic/fixed)
            
        Returns:
            list: Liste des cours traités
        """
        courses = []
        
        # Récupérer le premier nom de colonne qui est aussi le titre du cours
        course_title_col = self.dynamic_sheet_columns['course_name']
        
        # Parcourir toutes les lignes
        for idx, row in df.iterrows():
            # Ignorer les lignes vides ou sans données importantes
            if not row.get(course_title_col) or not row.get('DAY'):
                continue
            
            # Extraire les informations
            coach_name = row.get('Salma Choufani', '')
            day_str = row.get('DAY', '')
            time_france = row.get('TIME (France)', '')
            telegram_group = row.get('TELEGRAM GROUP ID', '')
            
            # Extraire le pattern et le niveau à partir du titre du cours
            course_title = str(row.get(course_title_col, ''))
            course_pattern = self.extract_course_pattern(course_title)
            course_level = self.extract_course_level(course_title)
            course_time = self.extract_time(course_title) or time_france
            
            # Convertir le jour en entier
            day_map = {
                'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                'Friday': 4, 'Saturday': 5, 'Sunday': 6,
                'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3,
                'Vendredi': 4, 'Samedi': 5, 'Dimanche': 6
            }
            
            day = day_map.get(day_str, 0)  # Fallback à lundi si jour non reconnu
            
            # Pattern et niveau par défaut si non trouvés
            if not course_pattern:
                # Déterminer le pattern à partir du jour
                if day in [0, 2]:  # Lundi ou Mercredi
                    course_pattern = "MW"
                elif day in [1, 3]:  # Mardi ou Jeudi
                    course_pattern = "TT"
                elif day in [4, 5]:  # Vendredi ou Samedi
                    course_pattern = "FS"
                elif day == 6:  # Dimanche
                    course_pattern = "SS"
                else:
                    course_pattern = "MW"  # Fallback
            
            if not course_level:
                course_level = "ABG"  # Niveau par défaut
            
            # Créer le cours
            course = {
                'name': f"{coach_name} - {course_level} - {course_pattern} - {course_time}",
                'instructor': "Kodjo",
                'professorName': coach_name,
                'level': course_level,
                'schedule': course_pattern,
                'dayOfWeek': self.get_day_name(day),
                'time': course_time,
                'zoomLink': '',
                'telegramGroup': telegram_group,
                'schedule_type': schedule_type,
                'description': f"Cours de {course_level} avec {coach_name}, {course_pattern} à {course_time}"
            }
            
            courses.append(course)
            logger.info(f"Cours extrait (Fixed): {course['name']} (Jour {day})")
        
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


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python excel_processor.py <path_to_excel_file>")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        sys.exit(1)
    
    processor = ExcelProcessor(excel_path)
    courses = processor.process_with_error_handling()
    
    if courses:
        output_path = processor.save_to_json(courses)
        print(f"OUTPUT_PATH={output_path}")
    else:
        print("Error: Processing failed")
        sys.exit(1)
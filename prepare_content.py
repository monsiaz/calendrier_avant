import os
import subprocess
import json
import shutil

# Configuration
SOURCE_DIR = 'Medias'
OUTPUT_DIR = 'Medias/web_ready'
DATA_FILE = 'calendar_data.js'

# Formats
IMAGE_EXTS = {'.heic', '.dng', '.jpg', '.jpeg', '.png'}
VIDEO_EXTS = {'.mov', '.mp4', '.m4v'}

def init_dirs():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    print(f"📂 Dossier de sortie : {OUTPUT_DIR}")

def convert_image(filename):
    name, ext = os.path.splitext(filename)
    input_path = os.path.join(SOURCE_DIR, filename)
    output_filename = f"{name}.jpg"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # Si le fichier existe déjà, on passe (sauf si forcé, ici on fait simple)
    if os.path.exists(output_path):
        return output_filename

    print(f"🔄 Conversion de {filename}...")
    
    try:
        # Utilisation de sips (macOS)
        subprocess.run(['sips', '-s', 'format', 'jpeg', input_path, '--out', output_path], 
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_filename
    except Exception as e:
        print(f"❌ Erreur sur {filename}: {e}")
        return None

def copy_video(filename):
    input_path = os.path.join(SOURCE_DIR, filename)
    output_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(output_path):
        shutil.copy2(input_path, output_path)
        print(f"🎥 Copie de la vidéo {filename}")
    
    return filename

def main():
    init_dirs()
    
    media_files = []
    
    # Liste tous les fichiers
    files = sorted([f for f in os.listdir(SOURCE_DIR) if not f.startswith('.') and os.path.isfile(os.path.join(SOURCE_DIR, f))])
    
    print(f"🔍 {len(files)} fichiers trouvés.")

    for f in files:
        ext = os.path.splitext(f)[1].lower()
        
        if ext in IMAGE_EXTS:
            new_name = convert_image(f)
            if new_name:
                media_files.append({'type': 'image', 'src': f"{OUTPUT_DIR}/{new_name}", 'original': f})
        
        elif ext in VIDEO_EXTS:
            new_name = copy_video(f)
            if new_name:
                media_files.append({'type': 'video', 'src': f"{OUTPUT_DIR}/{new_name}", 'original': f})
    
    # Génération des données pour 25 jours
    calendar_data = []
    total_medias = len(media_files)
    
    for i in range(1, 26): # 1 à 25
        if total_medias == 0:
            media = {'type': 'image', 'src': '', 'caption': 'Pas de média trouvé'}
        else:
            # On boucle sur les médias si on en a moins que 25
            media_idx = (i - 1) % total_medias
            media_item = media_files[media_idx]
            
            media = {
                'day': i,
                'type': media_item['type'],
                'src': media_item['src'],
                'caption': f"Souvenir du jour {i}" # Placeholder caption
            }
        calendar_data.append(media)

    # Écriture du fichier JS
    js_content = f"const GENERATED_CALENDAR_DATA = {json.dumps(calendar_data, indent=4)};"
    
    with open(DATA_FILE, 'w') as f:
        f.write(js_content)
    
    print(f"✅ Terminé ! Données écrites dans {DATA_FILE}")

if __name__ == "__main__":
    main()


from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load data files (create them if they don't exist)
def load_json_file(filename, default):
    try:
        with open(f'data/{filename}', 'r') as f:
            return json.load(f)
    except:
        return default

# BMI Data
BMI_DATA = load_json_file('bmi_data.json', {
    "bmi_categories": {
        "adult_20plus": {
            "both_genders": {
                "underweight": "<18.5",
                "normal": "18.5-24.9",
                "overweight": "25.0-29.9",
                "obese": "≥30.0"
            }
        }
    }
})

# Diet Data
DIET_DATA = load_json_file('diet_data.json', {
    "normal": {
        "south_india": {
            "medium": {
                "breakfast": {"dish": "Masala Dosa", "calories": "450 kcal"},
                "lunch": {"dish": "Rice + Sambar", "calories": "500 kcal"},
                "dinner": {"dish": "Chapati + Dal", "calories": "400 kcal"},
                "snacks": {"dish": "Fruit Bowl", "calories": "150 kcal"}
            }
        }
    }
})

# Exercise Data
EXERCISE_DATA = load_json_file('exercise_data.json', {
    "normal": {
        "adult_20plus": {
            "exercises": [
                {"name": "Walking", "duration": "30 minutes", "benefits": "Cardio health"},
                {"name": "Squats", "duration": "3 sets of 15", "benefits": "Leg strength"},
                {"name": "Push-ups", "duration": "3 sets of 10", "benefits": "Upper body strength"}
            ]
        }
    }
})

# In-memory storage for demo
medicines = []
exercises = []
bmi_records = []

# ==================== API ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'MediBuddy Backend is running!'
    })

@app.route('/api/bmi/calculate', methods=['POST'])
def calculate_bmi():
    try:
        data = request.json
        weight = data.get('weight')
        height = data.get('height')
        age = data.get('age', 30)
        gender = data.get('gender', 'male')
        user_id = data.get('user_id', 'demo-user')
        
        if not weight or not height:
            return jsonify({'error': 'Missing weight or height'}), 400
        
        # Calculate BMI
        height_m = height / 100
        bmi = round(weight / (height_m ** 2), 1)
        
        # Classify BMI
        if bmi < 18.5:
            category = "underweight"
        elif bmi < 25:
            category = "normal"
        elif bmi < 30:
            category = "overweight"
        else:
            category = "obese"
        
        # Store record
        record = {
            'id': len(bmi_records) + 1,
            'user_id': user_id,
            'bmi_value': bmi,
            'category': category,
            'weight': weight,
            'height': height,
            'age': age,
            'gender': gender,
            'created_at': datetime.now().isoformat()
        }
        bmi_records.append(record)
        
        return jsonify({
            'success': True,
            'bmi': bmi,
            'category': category,
            'record_id': record['id']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bmi/history/<user_id>', methods=['GET'])
def get_bmi_history(user_id):
    user_records = [r for r in bmi_records if r['user_id'] == user_id]
    return jsonify(user_records)

@app.route('/api/medicine/add', methods=['POST'])
def add_medicine():
    try:
        data = request.json
        medicine = {
            'id': len(medicines) + 1,
            'user_id': data.get('user_id', 'demo-user'),
            'name': data.get('name'),
            'dosage': data.get('dosage'),
            'time': data.get('time'),
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        medicines.append(medicine)
        return jsonify(medicine)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medicine/list/<user_id>', methods=['GET'])
def get_medicines(user_id):
    user_medicines = [m for m in medicines if m['user_id'] == user_id]
    return jsonify(user_medicines)

@app.route('/api/medicine/complete/<record_id>', methods=['PUT'])
def complete_medicine(record_id):
    try:
        for med in medicines:
            if str(med['id']) == record_id:
                med['status'] = 'completed'
                med['completed_at'] = datetime.now().isoformat()
                break
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exercise/add', methods=['POST'])
def add_exercise():
    try:
        data = request.json
        exercise = {
            'id': len(exercises) + 1,
            'user_id': data.get('user_id', 'demo-user'),
            'exercise_name': data.get('exercise_name'),
            'duration': data.get('duration'),
            'time': data.get('time'),
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        exercises.append(exercise)
        return jsonify(exercise)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exercise/list/<user_id>', methods=['GET'])
def get_exercises(user_id):
    user_exercises = [e for e in exercises if e['user_id'] == user_id]
    return jsonify(user_exercises)

@app.route('/api/exercise/complete/<record_id>', methods=['PUT'])
def complete_exercise(record_id):
    try:
        for ex in exercises:
            if str(ex['id']) == record_id:
                ex['status'] = 'completed'
                ex['completed_at'] = datetime.now().isoformat()
                break
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    # Get latest BMI
    user_records = [r for r in bmi_records if r['user_id'] == user_id]
    latest_bmi = user_records[0] if user_records else None
    
    category = latest_bmi['category'] if latest_bmi else 'normal'
    
    # Get diet recommendations
    diet_data = DIET_DATA.get(category, DIET_DATA.get('normal', {}))
    diet = diet_data.get('south_india', diet_data.get('medium', {}))
    
    # Get exercise recommendations
    exercise = EXERCISE_DATA.get(category, EXERCISE_DATA.get('normal', {}))
    
    return jsonify({
        'diet_plan': diet,
        'exercise_plan': exercise,
        'current_bmi': latest_bmi['bmi_value'] if latest_bmi else None,
        'category': category
    })

@app.route('/api/report/generate/<user_id>', methods=['GET'])
def generate_report(user_id):
    user_records = [r for r in bmi_records if r['user_id'] == user_id]
    user_medicines = [m for m in medicines if m['user_id'] == user_id]
    user_exercises = [e for e in exercises if e['user_id'] == user_id]
    
    total_meds = len(user_medicines)
    completed_meds = sum(1 for m in user_medicines if m.get('status') == 'completed')
    med_adherence = (completed_meds / total_meds * 100) if total_meds > 0 else 0
    
    total_ex = len(user_exercises)
    completed_ex = sum(1 for e in user_exercises if e.get('status') == 'completed')
    ex_completion = (completed_ex / total_ex * 100) if total_ex > 0 else 0
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'user': {'id': user_id, 'name': 'Demo User'},
        'bmi_statistics': {
            'total_records': len(user_records),
            'current_bmi': user_records[0]['bmi_value'] if user_records else None,
            'current_category': user_records[0]['category'] if user_records else None
        },
        'adherence': {
            'medicine_adherence': round(med_adherence, 1),
            'exercise_completion': round(ex_completion, 1)
        }
    }
    
    return jsonify(report)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 MediBuddy AI+ Pro Max Backend")
    print("="*60)
    print("✓ Flask server running")
    print("✓ All packages loaded")
    print(f"\n📍 Server: http://localhost:5000")
    print("📍 Health check: http://localhost:5000/api/health")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, host='0.0.0.0')
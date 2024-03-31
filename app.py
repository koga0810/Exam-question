from flask import Flask, render_template, jsonify, request
import os
import json

app = Flask(__name__)

def load_questions():
    filepath = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'questions.json')
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/questions')
def questions():
    return render_template('questions.html')

@app.route('/api/questions', methods=['GET'])
def get_questions():
    questions = load_questions()
    return jsonify(questions)

@app.route('/submit', methods=['POST'])
def submit_answers():
    submitted_answers = request.json.get('answers')
    questions = load_questions()
    score = 0
    results = []
    for question in questions:
        user_answer = submitted_answers.get(str(question['id']))
        is_correct = str(user_answer) == str(question['answer'])
        if is_correct:
            score += question['points']
        results.append({
            "question_id": question['id'],
            "is_correct": is_correct
        })
    return jsonify({"score": score, "results": results})

if __name__ == '__main__':
    app.run(debug=True)

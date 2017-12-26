"use strict";


/**
 * Proporciona operaciones para la gestión de tareas
 * en la base de datos.
 */
class daoQuestions {
    /**
     * Inicializa el DAO de tareas.
     * 
     * @param {Pool} pool Pool de conexiones MySQL. Todas las operaciones
     *                    sobre la BD se realizarán sobre este pool.
     */
    constructor(pool) {
        this.pool = pool;
    }



    /**
     * Inserta una pregunta asociada a un usuario.
     * 
     * 
     * @param {string} email Identificador del usuario
     * @param {object} task Tarea a insertar
     * @param {function} callback Función callback que será llamada tras la inserción
     */
    insertQuestion(question, callback) {
        this.pool.getConnection((err,connection) =>{
            if(err) { callback(err); return;}
            else {
                connection.query("INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?)",
                [question.default, question.text, question.op1, question.op2, question.op3, question.other],
                    (err, rows) =>{
                        connection.release();
                        if(err){ callback(err); return;}
                        else {
                            callback(null);
                        }
                    }
                );
            }
        });
    }

	/**
     * 
     * @param {*} callback Función que recibirá el objeto error y el resultado
     */
	randomQuestion(callback){
        this.pool.getConnection((err, connection) => {
            if(err){ callback(err); return;}
            connection.query(
                "SELECT question_text FROM questions ORDER BY RAND() LIMIT 4",
                (err, rows) =>{
                    if (err) { callback(err, undefined); return;}
                    else {
                        let questions = [];
                        rows.forEach(question => {
                            questions.push({ question:question.question_text});
                        });
                        callback(null, questions);
                    }
                }
            );
            
        });
    }
	/**
     * 
     * @param {*} randomQuestion 
     * @param {*} callback Función que recibirá el objeto error y el resultado
     */
	showQuestion(randomQuestion,callback){
        let allQuestions = [];
        allQuestions = randomQuestion;
       
        questions.forEach((allQuestions) => {
            response.write(allQuestions);
        });
    }
    /**
     * 
     * @param {*} question 
     * @param {*} callback Función que recibirá el objeto error y el resultado
     */
    newQuestion(question, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(err); return;}
            connection.query("INSERT INTO questions VALUES (NULL, ?)",
            [question.newQuestion],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err); return;}
                }
            );
        });
    }
}

module.exports = {
    daoQuestions: daoQuestions
}
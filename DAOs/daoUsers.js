"use strict";

/**
 * Proporciona operaciones para la gestión de usuarios
 * en la base de datos.
 */
class daoUsers {
    /**
     * Inicializa el DAO de usuarios.
     * 
     * @param {Pool} pool Pool de conexiones MySQL. Todas las operaciones
     *                    sobre la BD se realizarán sobre este pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Añade un usuario con sus correspondentes atributos a la base de datos.
     * @param {*} user 
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */
    newUser(user, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`); return;}
            connection.query("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
            [user.email, user.password, user.name, user.gender, user.birthdate, user.profile_picture, user.points],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err); return;}
                }
            );
        });
    }

    /**
     * Determina si un determinado usuario aparece en la BD con la contraseña
     * pasada como parámetro.
     * 
     * Es una operación asíncrona, de modo que se llamará a la función callback
     * pasando, por un lado, el objeto Error (si se produce, o null en caso contrario)
     * y, por otro lado, un booleano indicando el resultado de la operación
     * (true => el usuario existe, false => el usuario no existe o la contraseña es incorrecta)
     * En caso de error error, el segundo parámetro de la función callback será indefinido.
     * 
     * @param {string} email Identificador del usuario a buscar
     * @param {string} password Contraseña a comprobar
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */
    isUserCorrect(email, password, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`, undefined); return; }
            connection.query("SELECT email, password FROM users WHERE email= ? AND password = ?", 
            [email, password],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;}
                    if (rows.length === 0) {
                        callback(null, false);
                    }
                    else {
                        callback(null, true); 
                    }
                }
            );
        });
    }

    /**
     * Obtiene el nombre de fichero que contiene la imagen de perfil de un usuario.
     * 
     * Es una operación asíncrona, de modo que se llamará a la función callback
     * pasando, por un lado, el objeto Error (si se produce, o null en caso contrario)
     * y, por otro lado, una cadena con el nombre de la imagen de perfil (o undefined
     * en caso de producirse un error).
     * 
     * @param {string} email Identificador del usuario cuya imagen se quiere obtener
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */
    getUserImageName(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`); return; }
            connection.query("SELECT profile_picture FROM user WHERE email = ?",
            [email],
            (err, rows) => {
                connection.release();
                if (err) { callback(err); return; }
                if (rows.length === 0) {
                    callback(null, undefined);
                } else {
                    callback(null, rows[0].profile_picture);
                }
            });
        });
    }

    /**
    * Modifica los datos del usuario.
    * @param {User} user Identificador del usuario a buscar
    * @param {function} callback Función que informa del resultado del proceso.
    */
    modifyUser(user, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`); return;}
            connection.query("UPDATE users SET email = ?, password = ?, name = ?, gender = ?, birthdate = ?, profile_picture = ?, points = ? WHERE email = ?",
            [user.email, user.password, user.name, user.gender, user.birthdate, user.profile_picture, user.points, user.email],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;}
                    else {
                        callback(null, true);
                    }

                }
            );
        });
    }
    
    /**
     * Busca y devuelve un usuario de la base de datos
     * @param {String} email Identificador del usuario a buscar
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */
    getUser (email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`, undefined); return;}
            connection.query("SELECT * FROM users WHERE email = ?",
            [email],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;}
                    else {
                        let user;
                        if (rows.length > 0) {
                            user = {
                                email: rows[0].email, 
                                name: rows[0].name, 
                                password: rows[0].password,
                                gender: rows[0].gender,
                                birthdate: rows[0].birthdate,
                                profile_picture: rows[0].profile_picture,
                                points: rows[0].points
                            };
                        }
                        if (user !== undefined) { callback(null, user);}
                        else { callback(err, undefined);}
                    }
                }
            );
        });
    }   
    /**
     * Busca y devuelve los amigos de un usario en la base de datos.
     * @param {String} email Email que sirve como identificador del usuario cuyos amigos se van a buscar.
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */

    getUserFriends(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return;}
            else {
                connection.query("SELECT user1, name FROM friends JOIN users ON user1 = email WHERE status = 1 and user2 = ?",
                [email],
                (err, rows) => {
                    if (err) {
                        connection.release();
                        callback(err, undefined);
                        return;
                    } else {
                        let friends = [];
                        rows.forEach(row => {
                            friends.push({ name: row.name, email: row.user1 });
                        })
                        connection.query("SELECT user2, name FROM friends JOIN users ON user2 = email WHERE status = 1 AND user1 = ?",
                        [email],
                            (err, secondRows) => {
                                connection.release();
                                if (err) { callback(err, undefined); return;} 
                                else {
                                    secondRows.forEach(row => {
                                        friends.push({ name: row.name, email: row.user2 });
                                    })
                                callback(null, friends);
                                }
                            }
                        )
                    }
                })
            }
        });   
    }        
    
    /**
     * Función que devuelve las solicitudes de amistad que tiene un usuario
     * @param {String} email email del usuario logueado
     * @param {Function} callback Función que recibirá el objeto error y el resultado
     */
    getFriendRequests(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`, undefined); return; } 
            else {
                connection.query("SELECT user1, name FROM friends JOIN users ON email=user1 WHERE status = 0 and user2 = ?", 
                [email],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;} 
                    else {
                        let requests = [];
                        rows.forEach(row => {
                            requests.push({ name: row.name, email: row.user1 });
                        });
                        callback(null, requests);
                    }
                })
            }
        });
    }
        
    /**
     * Búsqueda de la cadena "string" en la base de datos.
     * @param {String} string cadena de texto para buscar en los nombres de usuario presentes en la base de datos.
     * @param {Function} callback Función que recibirá el objeto error y el resultado
     */
    search(string, loggedUserEmail, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return;}
            else {
                connection.query("SELECT email, name FROM users WHERE email != ? AND name LIKE ? AND email NOT IN " +
                "(SELECT user1 FROM friends WHERE user2 = ?) AND email NOT IN " +
                "(SELECT user2 FROM friends WHERE user1 = ?)", [loggedUserEmail, "%" + string + "%", loggedUserEmail, loggedUserEmail],
                    (err, rows) => {
                        connection.release();
                        if (err) { callback(err, undefined); return;}
                        else {
                            let friends = [];
                            rows.forEach(friend => {
                                friends.push({ name: friend.name, email: friend.email });
                            });
                            callback(null, friends);
                        }
                    }
                )
            }
        });
    }
        
    /**        
     * Realiza una petición de amistad entre dos usuarios de Facebluff.
     * @param {String} user1 email del usuario que envía la petición de amistad
     * @param {String} user2 email del usuario que la recibe
     * @param {Function} callback Función que recibirá el objeto error y el resultado
     */
    sendFriendRequest(user1, user2, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return; } 
            else {
                let pending = 0;
                connection.query("INSERT INTO amigos VALUES (?, ?, ?)",
                [user1, user2, pending],
                    (err, filas) => {
                        connection.release();
                        if (err) { callback(err, undefined); return;}
                        else {
                            callback(null, true);
                        }
                    }
                )
            }
        });
    }

    /**
     * Función que determina la resolución para una petición de amistad.
     * @param {String} user1 email del usuario que envió la petición de amistad
     * @param {String} user2 email del usuario que recibió la petición
     * @param {bool} response booleano que indica si el usuario que ha recibido la petición la acepta o la rechaza
     * @param {Function} callback Función que recibirá el objeto error y el resultado
     */
    friendRequestResponse(user1, user2, response, callback) {        
        this.pool.getConnection((err, connection) => {
            if (err) { callback(`Error de conexión: ${err.message}`, undefined); return; } 
            else {
                if (response) {
                    connection.query("UPDATE friends SET status = 1 WHERE user1 = ? AND user2 = ?",
                    [user1, user2],
                        (err, rows) => {
                            connection.release();
                            if (err) { callback(err, undefined); return; }
                             else {
                                callback(null, true);
                            }
                        }
                    )
                } else {
                    connection.query("DELETE FROM friends WHERE user1 = ? AND user2 = ?",
                    [user1, user2],
                        (err, filas) => {
                            connection.release();
                            if (err) { callback(err, undefined); return; }
                            else {
                               callback(null, true);
                           }
                        }
                    )
                }
            }
        });
    }
}

module.exports = {
    daoUsers: daoUsers
}
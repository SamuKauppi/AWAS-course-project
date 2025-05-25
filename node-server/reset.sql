DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS comments;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(50) NOT NULL,
  money INT DEFAULT 0
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  comment TEXT NOT NULL
);

INSERT INTO users (username, password, money) VALUES
('alice', 'password123', 100),
('bob', 'hunter2', 50),
('charlie', 'qwerty', 0);

INSERT INTO comments (username, comment) VALUES
('alice', 'Why are there so many hackers?'),
('bob', 'Hello from Bob!');

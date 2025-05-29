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
('rich_man', 'nopasss', 1000000),
('alice', 'password123', 100),
('bob', 'hunter2', 50),
('charlie', 'qwerty', 10),
('admin', 'bestadminever', 0);

INSERT INTO comments (username, created_at, comment) VALUES
('admin', '2020-01-05 00:00:00', 'This website is unhackable!'),
('alice', '2023-05-01 10:30:00', 'Why are there so many hackers?'),
('bob', '2023-05-02 12:00:00', 'Hello from Bob!'),
('rich_man', '2023-05-03 14:45:00', 'I have so much money!');

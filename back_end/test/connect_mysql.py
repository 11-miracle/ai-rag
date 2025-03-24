import pymysql

conn = pymysql.connect(
    host='43.134.175.26',
    port=3306,
    user='lanny',
    password='lannylogin',
)

cursor = conn.cursor()
cursor.execute("SHOW DATABASES")
databases = cursor.fetchall()








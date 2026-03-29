from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id'")
print(cursor.fetchall())

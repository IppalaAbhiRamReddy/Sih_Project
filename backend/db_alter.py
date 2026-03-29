from django.db import connection, transaction
with connection.cursor() as cursor:
    cursor.execute("ALTER TABLE profiles ALTER COLUMN department_id TYPE uuid USING (department_id::uuid)")
    # Wait! If values are null, it's fine.
    # If they are not null and not valid UUIDs, it fails.
    # I already checked they are null.
print("Transaction finished")

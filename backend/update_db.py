from database import get_db
from sqlite3 import Error

def update_database():
    print("Updating database schema...")
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            
            # Проверяем наличие колонки bet в таблице users
            c.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in c.fetchall()]
            
            if 'bet' not in columns:
                print("Adding bet column to users table...")
                c.execute('''
                    ALTER TABLE users
                    ADD COLUMN bet INTEGER DEFAULT 10000
                ''')
                conn.commit()
                print("Database schema updated successfully!")
            else:
                print("Bet column already exists in users table")
                
        except Error as e:
            print(f"Error updating database schema: {e}")
        finally:
            conn.close()
    else:
        print("Error: Could not establish database connection")

if __name__ == '__main__':
    update_database() 
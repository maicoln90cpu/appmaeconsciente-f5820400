-- Remover foreign key antiga que aponta para auth.users
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Criar nova foreign key apontando para profiles
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Criar índice para melhorar performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
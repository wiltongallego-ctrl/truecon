// Script de Debug Simples - Cole no Console do Navegador (F12 > Console)

// 1. Verificar usuário atual
const { data: { user } } = await supabase.auth.getUser();
console.log('👤 Usuário:', user?.id, user?.email);

// 2. Testar RPC has_role
const { data: hasRole, error: rpcError } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
console.log('🔧 RPC has_role:', hasRole, 'erro:', rpcError);

// 3. Consulta direta na tabela
const { data: roleData, error: tableError } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', user.id);
console.log('📋 Tabela user_roles:', roleData, 'erro:', tableError);

// 4. Verificar botão no DOM
const adminButton = document.querySelector('[data-testid="admin-button"]');
console.log('🎯 Botão Admin no DOM:', adminButton ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

// 5. Forçar re-render (se necessário)
if (hasRole && !adminButton) {
  console.log('🚨 PROBLEMA: RPC retorna true mas botão não está no DOM!');
  console.log('💡 Tente fazer um hard refresh (Ctrl+F5) ou relogar');
}
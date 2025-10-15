// Script de Debug para verificar problema do botão Admin
// Cole este código no console do navegador (F12 > Console)

async function debugAdminCheck() {
  console.log('🔍 Iniciando debug da verificação de admin...');
  
  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Usuário atual:', user?.id, user?.email);
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ Nenhum usuário logado');
      return;
    }
    
    // 2. Testar RPC has_role
    console.log('🔧 Testando RPC has_role...');
    const { data: hasRoleResult, error: rpcError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    console.log('📊 Resultado RPC has_role:', hasRoleResult);
    if (rpcError) {
      console.error('❌ Erro na RPC has_role:', rpcError);
    }
    
    // 3. Consulta direta na tabela user_roles
    console.log('📋 Consultando tabela user_roles diretamente...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('📊 Dados da tabela user_roles:', rolesData);
    if (rolesError) {
      console.error('❌ Erro na consulta user_roles:', rolesError);
    }
    
    // 4. Verificar se existe role admin
    const hasAdminRole = rolesData?.some(role => role.role === 'admin');
    console.log('🔑 Possui role admin na tabela:', hasAdminRole);
    
    // 5. Testar a lógica atual da Home
    console.log('🏠 Testando lógica atual da Home...');
    let isAdmin = false;
    
    try {
      const { data: rpcResult } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      isAdmin = rpcResult === true;
      console.log('✅ RPC funcionou, isAdmin:', isAdmin);
    } catch (rpcErr) {
      console.log('⚠️ RPC falhou, usando fallback...');
      const { data: fallbackData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      isAdmin = !!fallbackData;
      console.log('✅ Fallback executado, isAdmin:', isAdmin);
    }
    
    // 6. Verificar elemento do botão Admin no DOM
    const adminButton = document.querySelector('[data-testid="admin-button"]') || 
                       document.querySelector('button:contains("Admin")') ||
                       document.querySelector('a[href*="admin"]');
    
    console.log('🎯 Botão Admin no DOM:', adminButton ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    
    // 7. Resumo final
    console.log('\n📋 RESUMO DO DEBUG:');
    console.log('- Usuário logado:', !!user);
    console.log('- RPC has_role funciona:', !rpcError);
    console.log('- RPC retorna true:', hasRoleResult === true);
    console.log('- Role admin na tabela:', hasAdminRole);
    console.log('- isAdmin final:', isAdmin);
    console.log('- Botão no DOM:', !!adminButton);
    
    if (isAdmin && !adminButton) {
      console.log('🚨 PROBLEMA: isAdmin é true mas botão não está no DOM!');
      console.log('💡 Possíveis causas:');
      console.log('  - Estado React não atualizou');
      console.log('  - Renderização condicional com problema');
      console.log('  - Cache do navegador');
    }
    
  } catch (error) {
    console.error('💥 Erro geral no debug:', error);
  }
}

// Executar o debug
debugAdminCheck();
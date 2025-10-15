// Script de debug para verificar o modal da Fase 1
// Cole este código no console do navegador para diagnosticar o problema

console.log('🔍 Debug: Verificando modal da Fase 1...');

// Verificar usuário atual
const { data: { user } } = await supabase.auth.getUser();
console.log('👤 Usuário atual:', user?.id);

if (!user) {
  console.log('❌ Nenhum usuário logado');
} else {
  // Verificar dados na tabela user_phase1_checkins
  const { data: checkinData, error: checkinError } = await supabase
    .from('user_phase1_checkins')
    .select('*')
    .eq('user_id', user.id)
    .single();

  console.log('📊 Dados do checkin:', checkinData);
  console.log('🔍 is_first:', checkinData?.is_first);
  console.log('🔍 has_completed_first_time:', checkinData?.has_completed_first_time);
  console.log('🔍 checkin_days length:', checkinData?.checkin_days?.length);

  // Verificar localStorage
  const hasShownModal = localStorage.getItem(`hasShownPhase1Modal_${user.id}`);
  console.log('💾 localStorage hasShownPhase1Modal:', hasShownModal);

  // Verificar se o modal deveria aparecer
  const shouldShowModal = checkinData?.is_first && checkinData?.has_completed_first_time && hasShownModal !== 'true';
  console.log('🎯 Deveria mostrar modal?', shouldShowModal);

  // Verificar se o modal existe no DOM
  const modalElement = document.querySelector('[data-testid="phase1-completion-modal"]') || 
                      document.querySelector('.phase1-completion-modal') ||
                      document.querySelector('[role="dialog"]');
  console.log('🔍 Modal no DOM:', modalElement);

  // Resumo
  console.log('\n📋 RESUMO:');
  console.log('- is_first:', checkinData?.is_first);
  console.log('- has_completed_first_time:', checkinData?.has_completed_first_time);
  console.log('- localStorage já mostrou:', hasShownModal === 'true');
  console.log('- Modal deveria aparecer:', shouldShowModal);
  console.log('- Modal existe no DOM:', !!modalElement);
}
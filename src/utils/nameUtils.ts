/**
 * Processa um nome/email para extrair first_name e last_name
 * Remove @truechange.com, substitui pontos por espaços e capitaliza
 */
export const processNameFromEmail = (nameOrEmail: string): { firstName: string; lastName: string } => {
  if (!nameOrEmail) {
    return { firstName: '', lastName: '' };
  }

  let processedName = nameOrEmail.trim();

  // Remove @truechange.com (case insensitive)
  processedName = processedName.replace(/@truechange\.com$/i, '');
  
  // Substitui pontos por espaços
  processedName = processedName.replace(/\./g, ' ');
  
  // Remove espaços extras
  processedName = processedName.replace(/\s+/g, ' ').trim();
  
  // Capitaliza a primeira letra de cada palavra
  const words = processedName.split(' ').map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).filter(word => word.length > 0);

  if (words.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (words.length === 1) {
    return { firstName: words[0], lastName: '' };
  } else {
    return { 
      firstName: words[0], 
      lastName: words.slice(1).join(' ') 
    };
  }
};

/**
 * Formata o nome completo para exibição
 * Aplica o processamento de nome conforme especificado
 */
export const getDisplayName = (
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
  } | null,
  user?: {
    email?: string | null;
    user_metadata?: {
      name?: string | null;
      full_name?: string | null;
    };
  } | null
): string => {
  // Se já tem first_name no profile, usa ele
  if (profile?.first_name) {
    const fullName = profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.first_name;
    return fullName;
  }

  // Se tem name no profile, processa
  if (profile?.name) {
    const { firstName, lastName } = processNameFromEmail(profile.name);
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  // Se tem name no user_metadata, processa
  if (user?.user_metadata?.name) {
    const { firstName, lastName } = processNameFromEmail(user.user_metadata.name);
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  // Se tem full_name no user_metadata, processa
  if (user?.user_metadata?.full_name) {
    const { firstName, lastName } = processNameFromEmail(user.user_metadata.full_name);
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  // Se tem email do user, processa
  if (user?.email) {
    const { firstName, lastName } = processNameFromEmail(user.email);
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  return 'Usuário';
};

/**
 * Versão simplificada para objetos que já têm a estrutura completa
 */
export const getDisplayNameSimple = (user: {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
}): string => {
  // Se já tem first_name, usa ele
  if (user.first_name) {
    const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    return fullName;
  }

  // Se tem name, processa
  if (user.name) {
    const { firstName, lastName } = processNameFromEmail(user.name);
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  // Se tem email, processa
  if (user.email) {
    const { firstName, lastName } = processNameFromEmail(user.email);
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  return 'Usuário';
};
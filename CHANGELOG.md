# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.5] - 2025-01-15

### Adicionado
- Sistema completo de versionamento PWA com cache busting
- Notificações push para releases de fases no PWA
- Componente `UpdateNotification` para notificar sobre atualizações
- Utilitários de versão em `versionUtils.ts`
- Versão exibida no rodapé da página de login
- Service Worker aprimorado com suporte a push notifications
- Sistema de detecção automática de novas versões

### Alterado
- Service Worker atualizado para cache versionado (`truecon-pwa-v0.1.5`)
- `App.tsx` integrado com sistema de notificações e versionamento
- `package.json` atualizado para versão 0.1.5

### Corrigido
- Removidos secrets hardcoded do Edge Function
- Limpeza do histórico Git para remover dados sensíveis
- Configuração segura de variáveis de ambiente

### Segurança
- Variáveis sensíveis movidas para `.env`
- Edge Function configurado para usar variáveis de ambiente
- Histórico Git limpo de informações sensíveis

## [0.1.4] - 2025-01-14

### Adicionado
- Integração completa com Microsoft Graph API
- Edge Function para proxy do Microsoft Graph
- Sistema de busca automática de foto de perfil via Azure AD
- Componente `UserAvatar` com fallback inteligente
- Service `MicrosoftGraphService` para gerenciamento de API

### Alterado
- Melhorias na autenticação com Azure AD
- Sistema de gerenciamento de tokens aprimorado
- Interface de perfil de usuário atualizada

### Corrigido
- Problemas no carregamento de fotos de perfil
- Gerenciamento de tokens de acesso
- Fallback para avatar quando foto não disponível

## [0.1.3] - 2025-01-13

### Adicionado
- Sistema completo de XP (experiência)
- Fases dinâmicas com recompensas e progressão
- Sistema de check-in para Phase 1
- Ranking baseado em XP
- Interface administrativa para gerenciamento de fases

### Alterado
- Lógica de progressão de fases melhorada
- Sistema de recompensas implementado
- Interface de usuário aprimorada

### Corrigido
- Lógica de "primeira vez" corrigida
- Melhorias na conclusão de fases
- Correções em `phaseLogic.ts`

## [0.1.2] - 2025-01-12

### Alterado
- Sistema de build otimizado
- Dependências atualizadas e otimizadas
- Performance geral melhorada

### Corrigido
- Problemas de build resolvidos
- Conflitos de dependências corrigidos
- Arquivos de lock atualizados

## [0.1.1] - 2025-01-11

### Adicionado
- Login completo com Microsoft Azure AD
- Primeira fase do sistema implementada
- Interface básica de navegação
- Sistema de autenticação robusto

### Alterado
- Interface responsiva para mobile
- Navegação entre páginas melhorada

## [0.1.0] - 2025-01-10

### Adicionado
- Configuração inicial do projeto React Native/PWA
- Integração com Supabase para backend
- Configuração Capacitor para builds Android/iOS
- Configuração básica de PWA
- TypeScript configurado
- Tailwind CSS para estilização
- Vite como build system
- ESLint configurado

---

## Tipos de Mudanças

- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas

## Links

- [0.1.5]: https://github.com/truechange/truecon/compare/v0.1.4...v0.1.5
- [0.1.4]: https://github.com/truechange/truecon/compare/v0.1.3...v0.1.4
- [0.1.3]: https://github.com/truechange/truecon/compare/v0.1.2...v0.1.3
- [0.1.2]: https://github.com/truechange/truecon/compare/v0.1.1...v0.1.2
- [0.1.1]: https://github.com/truechange/truecon/compare/v0.1.0...v0.1.1
- [0.1.0]: https://github.com/truechange/truecon/releases/tag/v0.1.0
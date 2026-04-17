/**
 * Sanitize user-provided text before inclusion in Claude prompts.
 *
 * - Tronque a maxLen caracteres
 * - Supprime les sequences qui ressemblent a des instructions Claude
 *   (Human:, Assistant:, <system>, [INST]) pour eviter le prompt injection
 * - Ne modifie PAS le sens du texte — juste les patterns de controle
 */
export function sanitizeForPrompt(
  text: string,
  maxLen = 5000,
): string {
  let safe = text.slice(0, maxLen);

  // Supprimer les balises de controle connues des LLMs
  safe = safe
    .replace(/\bHuman\s*:/gi, "Humain :")
    .replace(/\bAssistant\s*:/gi, "Reponse :")
    .replace(/<\/?system>/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/\[\/INST\]/gi, "")
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .replace(/<\|endoftext\|>/gi, "");

  return safe.trim();
}

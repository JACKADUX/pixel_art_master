export type FieldValueResolver = (fieldId: string) => string;

/**
 * 渲染 Prompt 模板
 * 支持的占位符：
 * - {{self}}：当前字段的当前文本值
 * - {{field:ID}}：其他注册字段（通过 ID 标识）的当前文本值
 */
export function renderPromptTemplate(
  template: string,
  selfValue: string,
  resolver: FieldValueResolver
): string {
  if (!template) return "";
  
  // 替换 {{self}}
  let rendered = template.replace(/\{\{self\}\}/g, selfValue);
  
  // 匹配并替换 {{field:ID}}
  rendered = rendered.replace(/\{\{field:([^}]+)\}\}/g, (_, fieldId) => {
    return resolver(fieldId.trim());
  });
  
  return rendered;
}

/**
 * 从模板中提取所有被引用的 fieldId
 */
export function extractReferencedFields(template: string): string[] {
  const fields: string[] = [];
  const regex = /\{\{field:([^}]+)\}\}/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    const fieldId = match[1].trim();
    if (fieldId && !fields.includes(fieldId)) {
      fields.push(fieldId);
    }
  }
  return fields;
}

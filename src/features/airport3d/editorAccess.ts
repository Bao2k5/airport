// Local editing guard, not server-side authentication. Relock whenever the editor closes.
export const LAYOUT_EDITOR_PIN = '2005';
export const isLayoutEditorPinValid = (value: string): boolean => value === LAYOUT_EDITOR_PIN;

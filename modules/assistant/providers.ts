import type { AssistantIntent } from "./schemas";

export interface MessagingProvider { sendText(to: string, text: string): Promise<void>; }
export interface SpeechToTextProvider { transcribe(audio: Uint8Array, mimeType: string): Promise<string>; }
export interface IntentParser { parse(text: string): Promise<unknown>; }
export interface CalendarProvider { findAppointments(tenantId: string, customerName: string, date: string): Promise<Array<{ id: string; nome: string; inicio: string }>>; }

export class NoopMessagingProvider implements MessagingProvider { async sendText(): Promise<void> {} }
export class NoopSpeechToTextProvider implements SpeechToTextProvider { async transcribe(): Promise<string> { return ""; } }
export class NoopIntentParser implements IntentParser { async parse(): Promise<null> { return null; } }
export class NoopCalendarProvider implements CalendarProvider { async findAppointments(): Promise<Array<{ id: string; nome: string; inicio: string }>> { return []; } }

export class MockMessagingProvider implements MessagingProvider { readonly sent: Array<{ to: string; text: string }> = []; async sendText(to: string, text: string): Promise<void> { this.sent.push({ to, text }); } }
export class MockIntentParser implements IntentParser { constructor(private readonly output: unknown) {} async parse(): Promise<unknown> { return this.output; } }
export type AssistantAction = { createAppointment(input: Extract<AssistantIntent, { tipo: "criar_agendamento" }>): Promise<void>; cancelAppointment(id: string): Promise<void>; rescheduleAppointment(id: string, date: string, time: string): Promise<void>; registerExpense(input: Extract<AssistantIntent, { tipo: "registrar_despesa" }>): Promise<void> };

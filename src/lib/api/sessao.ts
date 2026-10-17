import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ErroApi } from "./erro";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export type FonteSessao = {
  token(): Promise<string | null>;
  renovar(): Promise<string | null>;
  entrarAnonimo(captchaToken?: string): Promise<string>;
};

let cliente: SupabaseClient | null = null;

const configurado = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function supabase(): SupabaseClient {
  if (!configurado()) {
    throw new ErroApi(0, "LOGIN_INDISPONIVEL", "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.");
  }
  cliente ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return cliente;
}

function erroDeLogin(status: number | undefined, codigo: string | undefined): ErroApi {
  if (status === 429 || codigo === "over_request_rate_limit") {
    return new ErroApi(429, "LIMITE_DE_LOGIN", "Muitos logins pela mesma rede.");
  }
  if (codigo === "captcha_failed") return new ErroApi(400, "CAPTCHA_FALHOU", "A verificação de segurança falhou.");
  return new ErroApi(status ?? 0, "LOGIN_INDISPONIVEL", "Não deu para entrar.");
}

export const sessaoSupabase: FonteSessao = {
  async token() {
    if (!configurado()) return null;
    const { data } = await supabase().auth.getSession();
    return data.session?.access_token ?? null;
  },
  async renovar() {
    if (!configurado()) return null;
    const { data, error } = await supabase().auth.refreshSession();
    return error ? null : (data.session?.access_token ?? null);
  },
  async entrarAnonimo(captchaToken) {
    const existente = await this.token();
    if (existente) return existente;
    const { data, error } = await supabase().auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
    if (error || !data.session) throw erroDeLogin(error?.status, error?.code);
    return data.session.access_token;
  },
};

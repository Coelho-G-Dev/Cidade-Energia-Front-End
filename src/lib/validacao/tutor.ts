import { z } from "zod";

export const TUTOR_MENSAGEM_MAXIMA = 500;
export const TUTOR_HISTORICO_MAXIMO = 10;
export const TUTOR_HISTORICO_TEXTO_MAXIMO = 1000;

export const tutorSchema = z
  .object({
    mensagem: z
      .string("Envie a mensagem como texto.")
      .trim()
      .min(1, "Escreva uma pergunta.")
      .max(TUTOR_MENSAGEM_MAXIMA, `A mensagem pode ter até ${TUTOR_MENSAGEM_MAXIMA} caracteres.`),
    historico: z
      .array(
        z
          .object({
            papel: z.enum(["usuario", "energinho"], "Use papel usuario ou energinho."),
            texto: z
              .string()
              .trim()
              .min(1)
              .max(TUTOR_HISTORICO_TEXTO_MAXIMO, `Cada mensagem do histórico pode ter até ${TUTOR_HISTORICO_TEXTO_MAXIMO} caracteres.`),
          })
          .strict(),
      )
      .max(TUTOR_HISTORICO_MAXIMO, `Envie no máximo as ${TUTOR_HISTORICO_MAXIMO} últimas mensagens.`)
      .default([]),
  })
  .strict();

export const avaliarTutorSchema = z
  .object({
    respostaId: z.string("Informe o identificador da resposta.").trim().min(1, "Informe o identificador da resposta."),
    util: z.boolean("Informe se a resposta ajudou."),
    motivo: z.enum(["errada", "confusa", "fora_do_tema"], "Motivo inválido.").optional(),
  })
  .strict()
  .refine((d) => d.motivo === undefined || d.util === false, {
    message: "O motivo só pode ser enviado quando util for false.",
    path: ["motivo"],
  });

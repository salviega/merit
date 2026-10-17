# Feedback a los sponsors — índice

> **Opcional.** Solo tiene sentido si el hackathon tiene sponsors cuya
> tecnología (SDK, API, protocolo, hardware) usas de verdad — no como
> requisito de un bounty aislado, sino como parte del stack real. Bórralo si
> no aplica.
>
> <!-- Por qué esto vale la pena incluso sin obligación de ningún track:
>      1) muchos tracks piden explícitamente "feedback sobre la experiencia
>      con nuestra documentación/SDK" como requisito de calificación — tener
>      esto ya escrito es el entregable, no trabajo extra;
>      2) escribir la sorpresa el mismo día que ocurre es mucho más preciso
>      que reconstruirla de memoria la noche antes de entregar;
>      3) es evidencia verificable de que probaste la tecnología a fondo, no
>      solo el happy path del tutorial. -->

Bitácora viva de lo que cada sponsor documenta o promete frente a lo que
encontramos al construir. No es una opinión al final del hackathon: cada
entrada se escribe **el mismo día** que se descubre algo, con la evidencia a
la mano — un archivo:línea, un mensaje de error exacto, un comando, una
captura.

No es una queja unilateral: cada archivo abre con lo que funcionó bien.

| Sponsor | Archivo |
| ------- | ------- |
| _[Sponsor 1]_ | [01_sponsor-example.md](./01_sponsor-example.md) — duplícalo y renombra |

## Cómo se usa cada archivo

<!-- Copia 01_sponsor-example.md una vez por sponsor cuya tecnología uses de
     verdad, y renómbralo. -->

1. **Se escribe en el momento**, no de memoria al final.
2. **Formato de cada entrada:** qué se documentaba o se esperaba, qué se
   encontró en la práctica, la evidencia exacta, el impacto que tuvo, y si se
   reportó aguas arriba (issue, PR, formulario del sponsor).
3. **La severidad no se infla.** Una diferencia que no costó nada es una
   nota, no un hallazgo.
4. **Al cerrar cada fase del [07](../definicion/07_plan-de-trabajo.md)**, se
   revisa si algo de esa fase merece una entrada aquí.
5. **Antes de enviar el proyecto,** cada archivo cierra con qué se reportó
   aguas arriba y qué quedó solo documentado aquí.

## Qué entra y qué no

**Entra:** una discrepancia entre lo que la documentación dice y lo que el
código hace; un error opaco que costó tiempo entender; un límite no
documentado; algo que funcionó mejor de lo esperado.

**No entra:** un error propio (una llamada mal armada, algo desactualizado a
mano) — eso es un bug del proyecto, no feedback al sponsor.

library(tidyverse)
library(covid19USP)


questoes_ <- questoes
dados <- importa_pesquisa()

saveRDS(dados, "./R/respostas.rds")

dados_validos <- dados %>% filter(!is.na(G2Q00001))


ggplot(dados_validos) + geom_bar(aes(y = G2Q00012))

ggplot(dados, aes(y = G2Q00001)) +
  geom_bar() +
  geom_text(stat='count', aes(label = ..count..))

ggplot(dados_validos, aes(y = G2Q00001)) +
  geom_bar() +
  geom_text(stat='count', aes(label = ..count..))


# avaliando tamanhos dos potenciais domínios ------------------------------



questoes_ref <- questoes %>%
  select(titulo, questao)

tamanhos_dominios <- dados_validos %>%
  select(-1:-8) %>%
  gather(key = titulo, value = resposta) %>%
  distinct() %>%
  count(titulo, sort = T, name = "qde_respostas_unicas") %>%
  left_join(questoes_ref)


ggplot(contagem) +
  geom_col(aes(y = reorder(questao, n), x = n))

summary(contagem)

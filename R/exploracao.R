library(tidyverse)
library(covid19USP)


questoes_ <- questoes
# dados <- importa_pesquisa()
# 
# saveRDS(dados, "./R/respostas.rds")
dados <- readRDS("./R/respostas.rds")

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


ggplot(tamanhos_dominios) +
  geom_col(aes(y = reorder(questao, qde_respostas_unicas), x = qde_respostas_unicas))

summary(contagem)


# avaliando tamanho máximo das categorias ---------------------------------

tamanhos_categorias <- dados_validos %>%
  select(-1:-8) %>%
  gather(key = titulo, value = resposta) %>%
  count(titulo, resposta, sort = T, name = "qde_respostas") %>%
  group_by(titulo) %>%
  summarise(maior_qde_respostas = max(qde_respostas)) %>%
  left_join(questoes_ref)



# selecionando perguntas --------------------------------------------------

perguntas_selecionadas <- c("G2Q00001", "G7Q00002", "G7Q00003")

dados_selecionados_pre <- dados_validos %>%
  select(all_of(perguntas_selecionadas)) %>%
  filter_all(all_vars(!is.na(.)))
  

questoes_vec <- questoes %>% 
  filter(titulo %in% perguntas_selecionadas) %>%
  select(titulo, questao)

variables <- c("vinculo", "genero", "cor")

names(dados_selecionados_pre) <- variables #questoes_vec$questao


# gera índices das variáveis principais (para facilitar o JS)  --------



gera_indice <- function(variable) {
  
  var <- as.name(variable)
  
  dados_selecionados_pre %>%
    group_by({{var}}) %>%
    mutate("indice_{{var}}" := row_number()) %>%
    ungroup() %>%
    select(starts_with("indice_"))
  
}

indices <- purrr::map(variables, gera_indice) %>%
  bind_cols()

dados_selecionados <- bind_cols(dados_selecionados_pre, indices)

# prototipos --------------------------------------------------------------

plota <- function(variable) {
  
  ggplot(dados_selecionados, aes_string(x = variable)) +
    geom_bar() + 
    geom_text(stat='count', aes(label = ..count..))
  
}

purrr::map(variables, plota)


# exporta -----------------------------------------------------------------

write.csv(dados_selecionados, "dados.csv", fileEncoding = "UTF-8")


# outros testes -----------------------------------------------------------

dados_selecionados %>%
  filter(cor == "Amarela") %>%
  count(vinculo)

dados_selecionados %>%
  filter(genero == "Feminino") %>%
  count(vinculo)

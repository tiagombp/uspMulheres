library(tidyverse)

load("./R/base.rda")

df <- base[["G3Q00019"]] 

tsa <- df %>% group_by(G7Q00002, G2Q00001, G7Q00003, pergunta) %>% count(resposta)

df2 <- base[["G3Q00001"]] 

tsa2 <- df2 %>% group_by(G7Q00002, G2Q00001, G7Q00003, pergunta) %>% count(resposta) %>% spread(resposta, value = n)

df2 %>% count(resposta) %>% spread(resposta, value = n)

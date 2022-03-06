#remotes::install_github("pesquisasuspmulheres/covid19USP")
library(tidyverse)
library(jsonlite)
library(weights)

base <- readRDS("./R/base_com_pesos_em_04_02_2022.rds") #readRDS("./R/base_em_20_05_2021.rds")
load("./R/questoes.rda")


# # corrige "G3Q00039", que está com a coluna "pergunta", mas toda como NA
# base[["G3Q00039"]]$pergunta <- NULL
# base[["G3Q00040"]]$pergunta <- NULL
# base[["G3Q00041"]]$pergunta <- NULL
# base[["G3Q00042"]]$pergunta <- NULL
# base[["G3Q00044"]]$pergunta <- NULL


# exemplo do novo cálculo com pesos
# calc <- base[[1]] %>%
#   count(genero, resposta, weights) %>%
#   mutate(n2 = weights * n) %>%
#   ungroup() %>%
#   group_by(genero, resposta) %>%
#   summarise(soma = sum(n2))
# %>%
#   group_by(genero) %>%
#   mutate(pct = soma/sum(soma))

# qG05Q230 <- base[["G05Q230"]]
# crianca <- qG05Q230 %>% 
#   filter(pergunta == "Criança ou adolescente sob a sua responsabilidade")
# wpct(crianca$resposta)
# wpct(crianca$resposta, crianca$weights)


# df <- base[["G3Q00019"]] 
# 
# tsa <- df %>% group_by(G7Q00002, G2Q00001, G7Q00003, pergunta) %>% count(resposta)
# 
# df2 <- base[["G3Q00001"]] 
# 
# tsa2 <- df2 %>% group_by(G7Q00002, G2Q00001, G7Q00003, pergunta) %>% count(resposta) %>% spread(resposta, value = n)
# 
# df2 %>% count(resposta) %>% spread(resposta, value = n)




#criterios <- c("G7Q00002", "G2Q00001", "G7Q00003", "G3Q00006")
#simples <- c("G7Q00002",	"G7Q00003",	"G2Q00001", "G3Q00006", "G3Q00025","G3Q00026","G3Q00027","G3Q00028","G3Q00029","G3Q00030","G3Q00031","G3Q00032","G3Q00033","G3Q00034","G3Q00035","G3Q00037","G3Q00038", "G04Q240", "G04Q241","G4Q00003","G4Q00011","G4Q00006","G4Q00014","G04Q235","G04Q237","G04Q238","G5Q00004", "G5Q00005","G05Q247","G5Q00006","G5Q00007","G500082","G05Q00083","G05Q245","G05Q246","G5Q00008","G05Q248","G5Q00009","G5Q00017","G5Q00018","G5Q00014","G5Q00015","G5Q00016","G5Q00046","G5Q00045","G5Q00051","G5Q00052","G05Q252","G5Q00053","G05Q227","G05Q229","G05Q231","G05Q233","G5Q00057","G5Q00058","G5Q00060","G5Q00061", "G6Q00006", "G6Q00009", "G6Q00018", "G6Q00020", "G6Q00022", "G6Q00042")

# # essas precisam ser divididas em subperguntas.
# multiplas_escala <- c("G3Q00019", "G3Q00020", "G3Q00021", "G3Q00022", "G3Q00024", "G3Q00036", "G3Q00041", "G3Q00042", "G6Q00017", "G6Q00019", "G6Q00021")

# tirei os criterior.. "G7Q00002",	"G7Q00003",	"G2Q00001",	
#facetas <- c("G3Q00006")

pega_questoes <- function(identificador) {
  
  quest <- questoes %>% 
    filter(grupo == identificador) %>% #, !str_detect(titulo, "Copy")) %>% 
    .$titulo %>% 
    unique()
  
  return(quest)
  
}

trabalho_estudo <- pega_questoes("Trabalho")
renda           <- pega_questoes("Renda") 
saude           <- pega_questoes("Saúde física e mental")
interacoes_lar  <- pega_questoes("Interações com outras pessoas e ambientes")

nomes_questoes <- questoes$questao
names(nomes_questoes) <- questoes$titulo

# df <- base[["G04Q240"]]
# df2 <- base[["G3Q00026"]]
# df2 <- base[["G3Q00019"]]
# nomes_questoes[["G3Q00026"]]

# output <- list()

# facetas

blocos <- list(trabalho_estudo, renda, saude, interacoes_lar)
nomes_blocos <- c("trabalho_estudo", "renda", "saude", "interacoes_lar")

output <- list()
i <- 1

for (bloco in blocos) { 
  
  nome <- nomes_blocos[i]
  i <- i + 1
  
  output[[nome]] <- list()

  for (pergunta in bloco) {
    
    dados_pre <- base[[pergunta]]
    
    # testa se está com o problema de vir com a coluna "pergunta", mas toda preenchida com NA
    if (!is.null(dados_pre$pergunta)) {
      if (sum(!is.na(dados_pre$pergunta)) == 0) {
        dados_pre$pergunta <- NULL
      }
    }
    
    if (is.null(dados_pre) || nrow(dados_pre) == 0) {
      print(paste(pergunta, 'Base vazia, pulando.'))
      next
    }
    
    tipo <- ifelse(
      "pergunta" %in% colnames(dados_pre),
      'multiplas com escala',
      'simples'
      )
    
    print(paste(pergunta, tipo))
    
    nome_completo <- nomes_questoes[pergunta]
    
    if(tipo == 'multiplas com escala') {
      
      sub_perguntas <- unique(dados_pre$pergunta)
      
      dados <- list()
      
      for (sub_pergunta in sub_perguntas) {
        
        sub_data <- dados_pre %>%
          filter(pergunta == sub_pergunta) 
        
        pesos <- sub_data$weights
        
        dados[[sub_pergunta]] <- sub_data %>%
          count(
            #campus,
            unidade,
            vinculo,
            genero, 
            #cor = G7Q00003,
            #filhos = G3Q00006,
            cor,
            filhos = filhos_menores,
            resposta,
            weights
          ) %>%
          mutate(n2 = weights * n) %>%
          ungroup() %>%
          group_by(unidade, vinculo, genero, cor, filhos, resposta) %>%
          summarise(n = sum(n2)) %>% ungroup()
        
        
      }
    
    } else {
      
      # para a pergunta G3Q00006, filhos, que é uma faceta
      if (pergunta == "G3Q00006") {
        dados_pre$filhos_menores = dados_pre$resposta 
      }
      
      pesos <- dados_pre$weights
      
      dados <- dados_pre %>%
        count(
          #campus,
          unidade,
          vinculo,
          genero, 
          #cor = G7Q00003,
          #filhos = G3Q00006,
          cor,
          filhos = filhos_menores,
          resposta,
          weights
        ) %>%
        mutate(n2 = weights * n) %>%
        ungroup() %>%
        group_by(unidade, vinculo, genero, cor, filhos, resposta) %>%
        summarise(n = sum(n2)) %>% ungroup()
      
      #print("salvou dados")
      
    }
    
    output[[nome]][[pergunta]] <- list(
      
      tipo = tipo,
      nome_completo = nome_completo,
      dados = dados

    )

  }
  
}



# filtros -----------------------------------------------------------------


filtros <- list(
  
  genero  = base[["G04Q240"]]$genero %>% levels(),
  vinculo = base[["G04Q240"]]$vinculo %>% levels(),
  cor     = base[["G04Q240"]]$cor %>% levels(),
  filhos  = base[["G04Q240"]]$filhos_menores %>% levels(),
  unidade  = base[["G04Q240"]]$unidade %>% levels()
  #cor     = base[["G04Q240"]]$G7Q00003 %>% levels(),
  #filhos  = base[["G04Q240"]]$G3Q00006 %>% levels(),
  #campus   = base[["G04Q240"]]$campus %>% levels()
  
)



# export ------------------------------------------------------------------

output_completo <- list(
  dados = output,
  filtros = filtros
)

jsonlite::write_json(output_completo, "output_completo.json")
# lembrar de corrigir um \" que aparece no json. Procurar por "pia".





# crap --------------------------------------------------------------------




nomes_questoes[["G7Q00002"]]


# output = {
#   facetas = {
#       cod_pergunta_1 = {
#            tipo: simples,
#            pergunta_completa : 'bla bla',
#            subperguntas : {},
#            dados : []
#            ou dados = {
#                  subperguntas

tsa<-base[["G3Q00019"]] %>% filter(pergunta == "Rotina de ensino a distância")

base[["G05Q246"]]


for (df in multiplas_escala) {
  
  niveis <- unique(base[[df]]$resposta) 
  
  print(paste(df, niveis))
  
}

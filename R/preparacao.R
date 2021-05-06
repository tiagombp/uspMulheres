library(tidyverse)

load("./R/base.rda")

df <- base[["G3Q00019"]] 

tsa <- df %>% group_by(G7Q00002, G2Q00001, G7Q00003, pergunta) %>% count(resposta)

df2 <- base[["G3Q00001"]] 

tsa2 <- df2 %>% group_by(G7Q00002, G2Q00001, G7Q00003, pergunta) %>% count(resposta) %>% spread(resposta, value = n)

df2 %>% count(resposta) %>% spread(resposta, value = n)




criterios <- c("G7Q00002",	"G7Q00003",	"G2Q00001")

simples <- c("G7Q00002",	"G7Q00003",	"G2Q00001",	"G3Q00006", "G3Q00025","G3Q00026","G3Q00027","G3Q00028","G3Q00029","G3Q00030","G3Q00031","G3Q00032","G3Q00033","G3Q00034","G3Q00035","G3Q00037","G3Q00038", "G04Q240", "G04Q241","G4Q00003","G4Q00011","G4Q00006","G4Q00014","G04Q235","G04Q237","G04Q238","G5Q00004", "G5Q00005","G05Q247","G5Q00006","G5Q00007","G500082","G05Q00083","G05Q245","G05Q246","G5Q00008","G05Q248","G5Q00009","G5Q00017","G5Q00018","G5Q00014","G5Q00015","G5Q00016","G5Q00046","G5Q00045","G5Q00051","G5Q00052","G05Q252","G5Q00053","G05Q227","G05Q229","G05Q231","G05Q233","G5Q00057","G5Q00058","G5Q00060","G5Q00061", "G6Q00006", "G6Q00009", "G6Q00018", "G6Q00020", "G6Q00022", "G6Q00042")

# essas precisam ser divididas em subperguntas.
multiplas_escala <- c("G3Q00019", "G3Q00020", "G3Q00021", "G3Q00022", "G3Q00024", "G3Q00036", "G3Q00041", "G3Q00042", "G6Q00017", "G6Q00019", "G6Q00021")

facetas <- c("G7Q00002",	"G7Q00003",	"G2Q00001",	"G3Q00006")

trabalho_estudo <- c("G3Q00025","G3Q00026","G3Q00027","G3Q00028","G3Q00029","G3Q00030","G3Q00031","G3Q00032","G3Q00033","G3Q00034","G3Q00035","G3Q00037","G3Q00038", "G3Q00019", "G3Q00020", "G3Q00021", "G3Q00022", "G3Q00024", "G3Q00036", "G3Q00041", "G3Q00042")

renda <- c("G04Q240", "G04Q241","G4Q00003","G4Q00011","G4Q00006","G4Q00014","G04Q235","G04Q237","G04Q238","G5Q00004")

saude <- c("G5Q00005","G05Q247","G5Q00006","G5Q00007","G500082","G05Q00083","G05Q245","G05Q246","G5Q00008","G05Q248","G5Q00009","G5Q00017","G5Q00018","G5Q00014","G5Q00015","G5Q00016","G5Q00046","G5Q00045","G5Q00051","G5Q00052","G05Q252","G5Q00053","G05Q227","G05Q229","G05Q231","G05Q233","G5Q00057","G5Q00058","G5Q00060","G5Q00061")

interacoes_lar <- c("G6Q00006", "G6Q00009", "G6Q00018", "G6Q00020", "G6Q00022", "G6Q00042", "G6Q00017", "G6Q00019", "G6Q00021")

nomes_questoes <- questoes_$questao_completa
names(nomes_questoes) <- questoes_$titulo

df <- base[["G04Q240"]]
df2 <- base[["G3Q00026"]]
nomes_questoes[["G3Q00026"]]

output <- list()

# facetas

vetor <- list(facetas, saude)
ve <- as.name(vetor)

for (df in vetor) { 
  
  for (element in df) {
    print(element, nomes_questoes[element])
  }
  
}


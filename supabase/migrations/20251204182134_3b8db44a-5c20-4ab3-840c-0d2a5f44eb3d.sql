INSERT INTO public.itens_viatura (nome, tipo, categoria, descricao) VALUES
-- Ferramentas mecânicas
('Macaco e Manivela', 'ferramenta', 'mecanico', 'Equipamento para elevação do veículo'),
('Chave de Roda', 'ferramenta', 'mecanico', 'Chave para remoção das rodas'),
('Chave do Estepe', 'ferramenta', 'mecanico', 'Chave específica para o estepe'),

-- Equipamentos mecânicos
('Estepe', 'equipamento', 'mecanico', 'Pneu reserva'),
('Calota', 'acessorio', 'mecanico', 'Proteção estética das rodas'),
('Roda de Ferro', 'equipamento', 'mecanico', 'Roda de ferro reserva'),
('Protetor do Cárter', 'acessorio', 'mecanico', 'Proteção inferior do motor'),

-- Equipamentos de segurança
('Extintor', 'equipamento', 'seguranca', 'Extintor de incêndio veicular'),
('Alarme', 'equipamento', 'seguranca', 'Sistema de alarme do veículo'),
('Etilômetro', 'equipamento', 'seguranca', 'Aparelho para teste de alcoolemia'),

-- Equipamentos de sinalização
('Triângulo', 'equipamento', 'sinalizacao', 'Triângulo de sinalização'),
('Sirene', 'equipamento', 'sinalizacao', 'Sirene de emergência'),
('Intermitente', 'equipamento', 'sinalizacao', 'Luz intermitente/giroflex'),
('Cone', 'equipamento', 'sinalizacao', 'Cone de sinalização'),

-- Equipamentos elétricos
('Antena do Rádio/CD', 'acessorio', 'eletrico', 'Antena do sistema de som'),
('Faróis Auxiliares', 'equipamento', 'eletrico', 'Faróis auxiliares/milha'),
('Brake-Light', 'equipamento', 'eletrico', 'Luz de freio adicional'),
('Rádio/CD', 'equipamento', 'eletrico', 'Sistema de som do veículo'),

-- Equipamentos de comunicação
('Antena do Transceptor', 'acessorio', 'comunicacao', 'Antena do rádio comunicador'),
('Transceptor', 'equipamento', 'comunicacao', 'Rádio comunicador fixo'),
('Hand Talk (HT)', 'equipamento', 'comunicacao', 'Rádio comunicador portátil'),
('Celular Funcional', 'equipamento', 'comunicacao', 'Telefone celular institucional'),

-- Documentos
('Cartão de Abastecimento', 'documento', 'outro', 'Cartão para abastecimento de combustível'),
('CRLV', 'documento', 'outro', 'Certificado de Registro e Licenciamento do Veículo'),
('Manual do Proprietário', 'documento', 'outro', 'Manual de instruções do veículo'),
('Livro de Ocorrência', 'documento', 'outro', 'Livro para registro de ocorrências'),

-- Acessórios diversos
('Borracha Lateral', 'acessorio', 'outro', 'Borracha de proteção lateral'),
('Lona Marítima', 'equipamento', 'outro', 'Lona para cobertura'),
('Travessa da Lona', 'acessorio', 'outro', 'Suporte para fixação da lona'),
('Tapete', 'acessorio', 'outro', 'Tapete interno do veículo'),
('Geleira', 'equipamento', 'outro', 'Caixa térmica/geleira');
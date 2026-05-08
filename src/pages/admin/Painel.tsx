import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { CadastrosPendentes } from '@/components/admin/CadastrosPendentes'
import { RequisicoesPendentes } from '@/components/admin/RequisicoesPendentes'

export default function PainelAprovacoes() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-[#8B5CF6] text-white p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-semibold font-geist tracking-tight">
            Painel Administrativo
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 mt-4">
        <Tabs defaultValue="cadastros" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-200/50 p-1 rounded-xl h-12">
            <TabsTrigger
              value="cadastros"
              className="rounded-lg h-10 data-[state=active]:bg-white data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-sm font-medium transition-all"
            >
              Cadastros Pendentes
            </TabsTrigger>
            <TabsTrigger
              value="requisicoes"
              className="rounded-lg h-10 data-[state=active]:bg-white data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-sm font-medium transition-all"
            >
              Requisições Pendentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastros" className="mt-0 focus-visible:outline-none">
            <CadastrosPendentes />
          </TabsContent>

          <TabsContent value="requisicoes" className="mt-0 focus-visible:outline-none">
            <RequisicoesPendentes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

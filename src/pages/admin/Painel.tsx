import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { CadastrosPendentes } from '@/components/admin/CadastrosPendentes'
import { RequisicoesPendentes } from '@/components/admin/RequisicoesPendentes'

export default function PainelAprovacoes() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-[#8B5CF6] text-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Painel Administrativo</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-4">
        <Tabs defaultValue="cadastros" className="w-full">
          <div className="px-3 sm:px-6">
            <TabsList className="w-full flex border-b border-slate-200 bg-transparent h-auto p-0 space-x-6 overflow-x-auto rounded-none justify-start mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <TabsTrigger
                value="cadastros"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#8B5CF6] data-[state=active]:bg-transparent data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none py-3 font-medium transition-all text-slate-500 whitespace-nowrap"
              >
                Cadastros Pendentes
              </TabsTrigger>
              <TabsTrigger
                value="requisicoes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#8B5CF6] data-[state=active]:bg-transparent data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none py-3 font-medium transition-all text-slate-500 whitespace-nowrap"
              >
                Requisições Pendentes
              </TabsTrigger>
            </TabsList>
          </div>

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

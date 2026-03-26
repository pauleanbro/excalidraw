import Link from "next/link";

export default function HandleNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f1] px-4">
      <h1 className="text-2xl font-bold text-[#20261f]">
        Perfil não encontrado
      </h1>
      <p className="mt-2 text-sm text-[#5f665a]">
        Este perfil não existe ou ainda não foi publicado.
      </p>
      <Link
        className="mt-6 inline-flex h-10 items-center rounded-full bg-[#3d5236] px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
        href="/"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

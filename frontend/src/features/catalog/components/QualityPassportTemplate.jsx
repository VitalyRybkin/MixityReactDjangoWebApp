import './QualityPassport.css'

const HEADER_SPEC_NAMES = new Set(['Условное обозначение', 'ТУ'])

function formatDate(dateString) {
    if (!dateString) return '—'
    const parts = String(dateString).split('-')
    if (parts.length !== 3) return String(dateString)
    return `${parts[2]}.${parts[1]}.${parts[0]}`
}

function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '—'
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return String(value)
    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 3,
    }).format(numeric)
}

function findSpec(specifications, name) {
    return specifications.find((spec) => spec.name?.trim() === name)?.value ?? ''
}

function splitDesignation(value) {
    const text = String(value ?? '').trim()
    const index = text.toLocaleUpperCase('ru-RU').indexOf('ГОСТ')
    const description = index === -1 ? text : text.slice(0, index).trim()
    const standard = index === -1 ? '' : text.slice(index).trim()

    const letters = description.replace(/[^a-zа-яё]/gi, '')
    const isUpperCase = letters.length > 0 && letters === letters.toLocaleUpperCase('ru-RU')
    const formattedDescription = isUpperCase
        ? `${description[0]}${description.slice(1).toLocaleLowerCase('ru-RU')}`
        : description

    return { description: formattedDescription, standard }
}

export default function QualityPassportTemplate({ passport }) {
    const specifications = passport.specifications ?? []
    const designation = splitDesignation(findSpec(specifications, 'Условное обозначение'))
    const technicalConditions = findSpec(specifications, 'ТУ')
    const technicalSpecs = specifications.filter(
        (spec) => spec.to_passport !== false && !HEADER_SPEC_NAMES.has(spec.name?.trim()),
    )

    const productUnit = passport.product?.product_unit
    const packageWeight = passport.product?.is_piece_based ? productUnit?.value : null

    return (
        <article className="qp-page">
            <header className="qp-company">
                <div className="qp-company-name">ООО «Авангард»</div>
                <div>пр. 2-й Муринский, д. 38 • Санкт-Петербург, Россия, 194021</div>
                <div>Электронная почта: rybkin@mixity.ru</div>
                <div>Веб-адрес: www.mixity.ru</div>
            </header>

            <section className="qp-heading">
                <h1>ПАСПОРТ КАЧЕСТВА № {passport.number}</h1>
                <p className="qp-issued">От {formatDate(passport.issue_date)} г.</p>
                <h2>{passport.product?.title || passport.product?.name || ''}</h2>
                {designation.description && <p className="qp-designation">{designation.description}</p>}
                {designation.standard && <p className="qp-standard">{designation.standard}</p>}
                {technicalConditions && (
                    <p className="qp-technical-conditions">ТУ {String(technicalConditions).replace(/^ТУ\s*/i, '')}</p>
                )}
            </section>

            <dl className="qp-details">
                <dt>Номер партии –</dt>
                <dd>{passport.batch_number || '—'}</dd>
                <dt>Дата изготовления –</dt>
                <dd>{formatDate(passport.production_date)}</dd>
                <dt>Количество –</dt>
                <dd>{formatNumber(passport.quantity)} т</dd>
                {packageWeight != null && (
                    <>
                        <dt>Масса упаковки –</dt>
                        <dd>{formatNumber(packageWeight)} кг</dd>
                    </>
                )}
            </dl>

            <h3 className="qp-section-heading">Технические показатели</h3>
            <table className="qp-specs">
                <thead>
                    <tr>
                        <th>
                            №<span className="qp-header-break">п/п</span>
                        </th>
                        <th>Параметры</th>
                        <th>Норма</th>
                    </tr>
                </thead>
                <tbody>
                    {technicalSpecs.map((spec, index) => (
                        <tr key={spec.id ?? `${spec.name}-${index}`}>
                            <td>{index + 1}</td>
                            <td>
                                {spec.name}
                                {spec.unit ? `, ${spec.unit}` : ''}
                            </td>
                            <td>{spec.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="qp-signature">
                <span>Главный технолог</span>
                <span>Рыбкин В. Л.</span>
            </footer>
        </article>
    )
}
